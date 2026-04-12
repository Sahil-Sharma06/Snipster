import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { randomBytes } from "crypto"

interface RouteContext {
  params: Promise<{ slug: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await context.params
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(slug)

    const blog = await prisma.blog.findFirst({
      where: {
        OR: isObjectId ? [{ slug }, { id: slug }] : [{ slug }],
      },
    })
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: { userId_blogId: { userId: user.id, blogId: blog.id } },
    })

    if (existingBookmark) {
      await prisma.bookmark.delete({ where: { id: existingBookmark.id } })
    } else {
      await prisma.bookmark.create({
        data: {
          userId: user.id,
          blogId: blog.id,
          // Keep snippetId non-null to avoid duplicate-key collisions on Mongo nullable unique indexes.
          snippetId: randomBytes(12).toString("hex"),
        },
      })
    }

    const count = await prisma.bookmark.count({ where: { blogId: blog.id } })

    return NextResponse.json({
      bookmarked: !existingBookmark,
      count,
    })
  } catch (error) {
    console.error("Error toggling bookmark:", error)
    return NextResponse.json(
      { error: "Failed to toggle bookmark" },
      { status: 500 }
    )
  }
}
