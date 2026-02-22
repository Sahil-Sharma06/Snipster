import { prisma } from "@/lib/db/prisma"
import { NotificationType } from "@prisma/client"

interface CreateNotificationInput {
  userId: string    // recipient
  actorId: string   // who triggered it
  type: NotificationType
  snippetId?: string
  blogId?: string
}

/**
 * Creates a notification. Silently no-ops if the actor is the recipient
 * (no self-notifications) or if an identical unread one already exists.
 */
export async function createNotification(input: CreateNotificationInput) {
  // Don't notify yourself
  if (input.userId === input.actorId) return

  try {
    // Deduplicate: skip if an identical unread notification already exists
    const existing = await prisma.notification.findFirst({
      where: {
        type: input.type,
        userId: input.userId,
        actorId: input.actorId,
        snippetId: input.snippetId ?? null,
        blogId: input.blogId ?? null,
        read: false,
      },
    })

    if (existing) return

    await prisma.notification.create({
      data: {
        type: input.type,
        userId: input.userId,
        actorId: input.actorId,
        snippetId: input.snippetId ?? null,
        blogId: input.blogId ?? null,
      },
    })
  } catch {
    // Silently swallow — notifications are best-effort
  }
}
