import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db/prisma"
import { createSnippetSchema } from "@/lib/validations/snippet"
import { z } from "zod"

/*
  ==============================================================================
  GET /api/snippets - LIST ALL PUBLIC SNIPPETS
  ==============================================================================
  
  This endpoint returns a list of all public snippets.
  No authentication required - anyone can view public snippets.
  
  QUERY PARAMETERS (optional):
  - limit: Number of snippets to return (default: 20, max: 100)
  - page: Page number for pagination (default: 1)
  - language: Filter by programming language
  - authorId: Filter by specific author
  
  ==============================================================================
*/

export async function GET(request: Request) {
  try {
    // ========================================================================
    // PARSE QUERY PARAMETERS
    // ========================================================================
    // Extract URL query parameters (e.g., ?limit=10&page=2)
    const { searchParams } = new URL(request.url)
    
    // Get pagination parameters with defaults
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100) // Max 100
    const page = Math.max(Number(searchParams.get("page")) || 1, 1) // Min 1
    const skip = (page - 1) * limit // Calculate offset for pagination
    
    // Get filter parameters
    const language = searchParams.get("language")
    const authorId = searchParams.get("authorId")

    // ========================================================================
    // BUILD QUERY FILTERS
    // ========================================================================
    // Create Prisma where clause based on query parameters
    const where: any = {
      isPublic: true, // Only show public snippets
    }

    // Add language filter if provided
    if (language) {
      where.language = language
    }

    // Add author filter if provided
    if (authorId) {
      where.authorId = authorId
    }

    // ========================================================================
    // FETCH SNIPPETS FROM DATABASE
    // ========================================================================
    // Run two queries in parallel for efficiency
    const [snippets, total] = await Promise.all([
      // Query 1: Get snippets with pagination
      prisma.snippet.findMany({
        where,
        take: limit, // How many to return
        skip, // How many to skip (for pagination)
        orderBy: {
          createdAt: "desc", // Newest first
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
          _count: {
            select: {
              likes: true,
              comments: true,
              bookmarks: true,
            },
          },
        },
      }),

      // Query 2: Count total snippets (for pagination info)
      prisma.snippet.count({ where }),
    ])

    // ========================================================================
    // RETURN RESPONSE WITH PAGINATION METADATA
    // ========================================================================
    return NextResponse.json({
      snippets,
      pagination: {
        total, // Total number of snippets
        page, // Current page
        limit, // Items per page
        totalPages: Math.ceil(total / limit), // Total pages
        hasMore: skip + snippets.length < total, // Are there more pages?
      },
    })
  } catch (error) {
    console.error("Error fetching snippets:", error)
    
    return NextResponse.json(
      { error: "Failed to fetch snippets" },
      { status: 500 }
    )
  }
}

/*
  ==============================================================================
  POST /api/snippets - CREATE NEW SNIPPET
  ==============================================================================
*/

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in to create snippets" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please try logging in again." },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = createSnippetSchema.parse(body)

    const snippet = await prisma.snippet.create({
      data: {
        ...validatedData,
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

    return NextResponse.json(snippet, { status: 201 })
  } catch (error) {
    console.error("Error creating snippet:", error)

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

    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "A snippet with this data already exists" },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to create snippet. Please try again." },
      { status: 500 }
    )
  }
}