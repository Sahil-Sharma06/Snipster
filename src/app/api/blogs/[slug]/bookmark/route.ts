import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db/prisma"

interface RouteContext {
  params: Promise<{ slug: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { slug: id } = await context.params

    const blog = await prisma.blog.findUnique({ where: { id } })
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
        data: { userId: user.id, blogId: blog.id },
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
