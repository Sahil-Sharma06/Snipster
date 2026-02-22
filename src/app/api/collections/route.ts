import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db/prisma"
import { createCollectionSchema } from "@/lib/validations/collection"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const collections = await prisma.collection.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { snippets: true },
        },
      },
    })

    return NextResponse.json(collections)
  } catch (error) {
    console.error("Error fetching collections:", error)
    return NextResponse.json(
      { error: "Failed to fetch collections" },
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
    const data = createCollectionSchema.parse(body)

    const collection = await prisma.collection.create({
      data: {
        ...data,
        userId: user.id,
      },
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    console.error("Error creating collection:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    )
  }
}
