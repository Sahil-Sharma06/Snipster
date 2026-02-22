import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db/prisma"
import { ZodError } from "zod"
import { updateBlogSchema } from "@/lib/validations/blog"

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

    // Regenerate slug if title changes
    if (data.title && data.title !== blog.title) {
      let newSlug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 100)

      // Ensure slug is unique
      let slugExists = await prisma.blog.findUnique({
        where: { slug: newSlug },
      })
      let counter = 1
      while (slugExists && slugExists.id !== blog.id) {
        newSlug = `${newSlug}-${counter}`
        slugExists = await prisma.blog.findUnique({
          where: { slug: newSlug },
        })
        counter++
      }
      updateData.slug = newSlug
    }

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
    if (error instanceof ZodError) {
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
