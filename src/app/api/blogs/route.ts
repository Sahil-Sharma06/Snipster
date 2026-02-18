import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const createBlogSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string().max(30)).max(10),
  published: z.boolean().default(false),
})

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100)
}

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

export async function GET() {
  try {
    const blogs = await prisma.blog.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
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

    return NextResponse.json(blogs)
  } catch (error) {
    console.error("Error fetching blogs:", error)
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const data = createBlogSchema.parse(body)

    const baseSlug = generateSlug(data.title)
    let slug = baseSlug
    let counter = 1

    while (await prisma.blog.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const readTime = calculateReadTime(data.content)

    const blog = await prisma.blog.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        coverImage: data.coverImage || undefined,
        tags: data.tags,
        published: data.published,
        publishedAt: data.published ? new Date() : null,
        readTime,
        authorId: user.id,
      },
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

    return NextResponse.json(blog, { status: 201 })
  } catch (error) {
    console.error("Error creating blog:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create blog" },
      { status: 500 }
    )
  }
}
