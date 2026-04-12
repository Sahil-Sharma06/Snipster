import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { randomBytes } from "crypto"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: snippetId } = await context.params

    const snippet = await prisma.snippet.findUnique({ where: { id: snippetId } })
    if (!snippet) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 })
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: { userId_snippetId: { userId: user.id, snippetId } },
    })

    if (existingBookmark) {
      await prisma.bookmark.delete({ where: { id: existingBookmark.id } })
    } else {
      await prisma.bookmark.create({
        data: {
          userId: user.id,
          snippetId,
          // Keep blogId non-null to avoid duplicate-key collisions on Mongo nullable unique indexes.
          blogId: randomBytes(12).toString("hex"),
        },
      })
    }

    const count = await prisma.bookmark.count({ where: { snippetId } })

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
