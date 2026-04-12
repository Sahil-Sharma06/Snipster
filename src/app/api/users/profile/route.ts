import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { z } from "zod"

const updateProfileSchema = z.object({
  image: z.string().url("Invalid image URL").or(z.literal("")).optional(),
  name: z.string().min(1, "Name is required").max(60).optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores and hyphens"
    )
    .optional(),
  bio: z.string().max(250, "Bio must be 250 characters or less").optional(),
  websiteUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
  githubUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
  twitterUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
})

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid data" },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check username uniqueness if changing it
    if (data.username && data.username !== user.username) {
      const existing = await prisma.user.findUnique({
        where: { username: data.username },
      })
      if (existing) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.image !== undefined && { image: data.image || null }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.bio !== undefined && { bio: data.bio || null }),
        ...(data.websiteUrl !== undefined && {
          websiteUrl: data.websiteUrl || null,
        }),
        ...(data.githubUrl !== undefined && {
          githubUrl: data.githubUrl || null,
        }),
        ...(data.twitterUrl !== undefined && {
          twitterUrl: data.twitterUrl || null,
        }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
