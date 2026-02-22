import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim() ?? ""
    const take = Math.min(parseInt(searchParams.get("take") ?? "20", 10), 50)
    const skip = Math.max(parseInt(searchParams.get("skip") ?? "0", 10), 0)

    const currentUser = await getCurrentUser()

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { username: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          _count: {
            select: {
              snippets: true,
              followers: true,
            },
          },
          ...(currentUser
            ? {
                followers: {
                  where: { followerId: currentUser.id },
                  select: { id: true },
                },
              }
            : {}),
        },
      }),
      prisma.user.count({ where }),
    ])

    const usersWithFollowState = users.map((u) => ({
      ...u,
      isFollowing:
        "followers" in u
          ? (u.followers as { id: string }[]).length > 0
          : false,
      followers: undefined,
    }))

    return NextResponse.json({ users: usersWithFollowState, total })
  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    )
  }
}
