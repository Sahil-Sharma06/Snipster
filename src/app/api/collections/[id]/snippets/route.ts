import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

interface RouteContext {
  params: Promise<{ id: string }>
}

const snippetSchema = z.object({
  snippetId: z.string().min(1),
})

// POST /api/collections/[id]/snippets — add a snippet to a collection
export async function POST(req: Request, context: RouteContext) {
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
    const { snippetId } = snippetSchema.parse(body)

    // Verify snippet exists
    const snippet = await prisma.snippet.findUnique({ where: { id: snippetId } })
    if (!snippet) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 })
    }

    const entry = await prisma.collectionSnippet.upsert({
      where: { collectionId_snippetId: { collectionId: id, snippetId } },
      create: { collectionId: id, snippetId },
      update: {},
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error("Error adding snippet to collection:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to add snippet" }, { status: 500 })
  }
}

// DELETE /api/collections/[id]/snippets — remove a snippet from a collection
export async function DELETE(req: Request, context: RouteContext) {
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
    const { snippetId } = snippetSchema.parse(body)

    await prisma.collectionSnippet.delete({
      where: { collectionId_snippetId: { collectionId: id, snippetId } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing snippet from collection:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to remove snippet" }, { status: 500 })
  }
}
