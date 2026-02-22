import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { createNotification } from "@/lib/notifications"

interface Params {
  params: Promise<{ userId: string }>
}

export async function POST(request: Request, { params }: Params) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await params

    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      )
    }

    // Check target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: userId,
        },
      },
    })

    if (existing) {
      // Unfollow
      await prisma.follow.delete({ where: { id: existing.id } })
      return NextResponse.json({ following: false })
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: currentUser.id,
          followingId: userId,
        },
      })

      // Send notification to the followed user
      await createNotification({
        userId: userId,
        actorId: currentUser.id,
        type: "FOLLOW",
      })

      return NextResponse.json({ following: true })
    }
  } catch (error) {
    console.error("Error toggling follow:", error)
    return NextResponse.json(
      { error: "Failed to update follow status" },
      { status: 500 }
    )
  }
}
