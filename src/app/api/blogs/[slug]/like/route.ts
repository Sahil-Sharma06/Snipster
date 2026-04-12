import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { createNotification } from "@/lib/notifications"
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

    const existingLike = await prisma.like.findUnique({
      where: { userId_blogId: { userId: user.id, blogId: blog.id } },
    })

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } })
    } else {
      await prisma.like.create({
        data: {
          userId: user.id,
          blogId: blog.id,
          // Keep snippetId non-null to avoid duplicate-key collisions on Mongo nullable unique indexes.
          snippetId: randomBytes(12).toString("hex"),
        },
      })
      await createNotification({
        userId: blog.authorId,
        actorId: user.id,
        type: "LIKE_BLOG",
        blogId: blog.id,
      })
    }

    const count = await prisma.like.count({ where: { blogId: blog.id } })

    return NextResponse.json({
      liked: !existingLike,
      count,
    })
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    )
  }
}
