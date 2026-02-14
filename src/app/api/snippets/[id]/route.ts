import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db/prisma"
import { createSnippetSchema } from "@/lib/validations/snippet"
import { z } from "zod"

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/*
  ==============================================================================
  GET /api/snippets/[id] - GET SINGLE SNIPPET
  ==============================================================================
*/
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const snippet = await prisma.snippet.findUnique({
      where: { id },
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

    if (!snippet) {
      return NextResponse.json(
        { error: "Snippet not found" },
        { status: 404 }
      )
    }

    // Check if snippet is public or user is the author
    const { userId } = await auth()
    if (!snippet.isPublic) {
      if (!userId) {
        return NextResponse.json(
          { error: "This snippet is private" },
          { status: 403 }
        )
      }

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      })

      if (user?.id !== snippet.authorId) {
        return NextResponse.json(
          { error: "This snippet is private" },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(snippet)
  } catch (error) {
    console.error("Error fetching snippet:", error)
    return NextResponse.json(
      { error: "Failed to fetch snippet" },
      { status: 500 }
    )
  }
}

/*
  ==============================================================================
  PATCH /api/snippets/[id] - UPDATE SNIPPET
  ==============================================================================
*/
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in to update snippets" },
        { status: 401 }
      )
    }

    // Try to find user, if not found, create from Clerk data
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      // Get Clerk user data and create database record
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      
      const email = clerkUser.emailAddresses[0]?.emailAddress
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: email,
          name: name,
          image: clerkUser.imageUrl,
          username: clerkUser.username || null,
        },
      })
    }

    const { id } = await context.params

    // Check if snippet exists and user is the author
    const existingSnippet = await prisma.snippet.findUnique({
      where: { id },
    })

    if (!existingSnippet) {
      return NextResponse.json(
        { error: "Snippet not found" },
        { status: 404 }
      )
    }

    if (existingSnippet.authorId !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own snippets" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createSnippetSchema.parse(body)

    const snippet = await prisma.snippet.update({
      where: { id },
      data: validatedData,
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

    return NextResponse.json(snippet)
  } catch (error) {
    console.error("Error updating snippet:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input",
          issues: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update snippet" },
      { status: 500 }
    )
  }
}

/*
  ==============================================================================
  DELETE /api/snippets/[id] - DELETE SNIPPET
  ==============================================================================
*/
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in to delete snippets" },
        { status: 401 }
      )
    }

    // Try to find user, if not found, create from Clerk data
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      // Get Clerk user data and create database record
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      
      const email = clerkUser.emailAddresses[0]?.emailAddress
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: email,
          name: name,
          image: clerkUser.imageUrl,
          username: clerkUser.username || null,
        },
      })
    }

    const { id } = await context.params

    // Check if snippet exists and user is the author
    const existingSnippet = await prisma.snippet.findUnique({
      where: { id },
    })

    if (!existingSnippet) {
      return NextResponse.json(
        { error: "Snippet not found" },
        { status: 404 }
      )
    }

    if (existingSnippet.authorId !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own snippets" },
        { status: 403 }
      )
    }

    await prisma.snippet.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: "Snippet deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting snippet:", error)
    return NextResponse.json(
      { error: "Failed to delete snippet" },
      { status: 500 }
    )
  }
}
