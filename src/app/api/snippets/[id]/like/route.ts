import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db/prisma"
import { createNotification } from "@/lib/notifications"

interface RouteContext {
  params: Promise<{ id: string }>
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

    const { id: snippetId } = await context.params

    const snippet = await prisma.snippet.findUnique({ where: { id: snippetId } })
    if (!snippet) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 })
    }

    const existingLike = await prisma.like.findUnique({
      where: { userId_snippetId: { userId: user.id, snippetId } },
    })

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } })
    } else {
      await prisma.like.create({
        data: { userId: user.id, snippetId },
      })
      // Notify snippet author
      await createNotification({
        userId: snippet.authorId,
        actorId: user.id,
        type: "LIKE_SNIPPET",
        snippetId,
      })
    }

    const count = await prisma.like.count({ where: { snippetId } })

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
