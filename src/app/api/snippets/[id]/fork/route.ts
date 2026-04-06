import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth/current-user"
import { prisma } from "@/lib/db/prisma"

// POST /api/snippets/[id]/fork — Duplicate a public snippet to the current user's account
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params

    const original = await prisma.snippet.findUnique({
      where: { id },
    })

    if (!original) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 })
    }

    if (!original.isPublic && original.authorId !== user.id) {
      return NextResponse.json({ error: "Cannot fork a private snippet" }, { status: 403 })
    }

    // Prevent forking your own snippet
    if (original.authorId === user.id) {
      return NextResponse.json(
        { error: "You cannot fork your own snippet" },
        { status: 400 }
      )
    }

    const forked = await prisma.snippet.create({
      data: {
        title: `${original.title} (forked)`,
        description: original.description,
        code: original.code,
        language: original.language,
        tags: original.tags,
        isPublic: false, // Forks start as private — user can choose to publish
        authorId: user.id,
      },
    })

    return NextResponse.json({ id: forked.id }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "You must be logged in to fork snippets" }, { status: 401 })
    }
    console.error("Error forking snippet:", error)
    return NextResponse.json({ error: "Failed to fork snippet" }, { status: 500 })
  }
}
