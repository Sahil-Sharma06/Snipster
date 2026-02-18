import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const updateBlogSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string().max(30)).max(10).optional(),
  published: z.boolean().optional(),
})

interface RouteContext {
  params: Promise<{ slug: string }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params

    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    })

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    return NextResponse.json(blog)
  } catch (error) {
    console.error("Error fetching blog:", error)
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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

    if (blog.authorId !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own blog posts" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = updateBlogSchema.parse(body)

    const updateData: any = { ...data }

    if (data.published && !blog.published) {
      updateData.publishedAt = new Date()
    }

    if (data.content) {
      const wordsPerMinute = 200
      const words = data.content.trim().split(/\s+/).length
      updateData.readTime = Math.ceil(words / wordsPerMinute)
    }

    const updatedBlog = await prisma.blog.update({
      where: { slug },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(updatedBlog)
  } catch (error) {
    console.error("Error updating blog:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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

    if (blog.authorId !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own blog posts" },
        { status: 403 }
      )
    }

    await prisma.blog.delete({ where: { slug } })

    return NextResponse.json({ message: "Blog deleted successfully" })
  } catch (error) {
    console.error("Error deleting blog:", error)
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    )
  }
}
