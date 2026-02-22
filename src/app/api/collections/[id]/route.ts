import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db/prisma"
import { ZodError } from "zod"
import { updateCollectionSchema } from "@/lib/validations/collection"

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/collections/[id] — fetch collection + its snippets
export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const { userId } = await auth()

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true, clerkId: true },
        },
        snippets: {
          orderBy: { addedAt: "desc" },
          include: {
            snippet: {
              include: {
                author: {
                  select: { id: true, name: true, username: true, image: true },
                },
                _count: {
                  select: { likes: true, comments: true, bookmarks: true },
                },
              },
            },
          },
        },
        _count: { select: { snippets: true } },
      },
    })

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    // Private collections only visible to owner
    if (!collection.isPublic && collection.user.clerkId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(collection)
  } catch (error) {
    console.error("Error fetching collection:", error)
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 })
  }
}

// PATCH /api/collections/[id] — update name / description / visibility
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const collection = await prisma.collection.findUnique({ where: { id } })
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    if (collection.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const data = updateCollectionSchema.parse(body)

    const updated = await prisma.collection.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating collection:", error)
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 })
  }
}

// DELETE /api/collections/[id] — delete collection
export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const collection = await prisma.collection.findUnique({ where: { id } })
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    if (collection.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.collection.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting collection:", error)
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 })
  }
}
