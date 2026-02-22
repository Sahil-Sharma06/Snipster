import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db/prisma"
import { createNotification } from "@/lib/notifications"

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

    const { slug } = await context.params

    const blog = await prisma.blog.findUnique({ where: { slug } })
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
        data: { userId: user.id, blogId: blog.id },
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
