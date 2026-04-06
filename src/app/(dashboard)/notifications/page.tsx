import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Heart, MessageCircle, UserPlus, CheckCheck } from "lucide-react"
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"

type NotificationType =
  | "FOLLOW"
  | "LIKE_SNIPPET"
  | "LIKE_BLOG"
  | "COMMENT_SNIPPET"
  | "COMMENT_BLOG"

function notificationText(
  type: NotificationType,
  actorName: string,
  snippetTitle?: string | null,
  blogTitle?: string | null
): string {
  switch (type) {
    case "FOLLOW": return `${actorName} started following you`
    case "LIKE_SNIPPET": return `${actorName} liked your snippet${snippetTitle ? ` "${snippetTitle}"` : ""}`
    case "LIKE_BLOG": return `${actorName} liked your blog post${blogTitle ? ` "${blogTitle}"` : ""}`
    case "COMMENT_SNIPPET": return `${actorName} commented on your snippet${snippetTitle ? ` "${snippetTitle}"` : ""}`
    case "COMMENT_BLOG": return `${actorName} commented on${blogTitle ? ` "${blogTitle}"` : " your blog post"}`
  }
}

function notificationHref(
  type: NotificationType,
  actorUsername?: string | null,
  snippetId?: string | null,
  blogSlug?: string | null
): string {
  switch (type) {
    case "FOLLOW": return actorUsername ? `/profile/${actorUsername}` : "/feed"
    case "LIKE_SNIPPET":
    case "COMMENT_SNIPPET": return snippetId ? `/snippets/${snippetId}` : "/feed"
    case "LIKE_BLOG":
    case "COMMENT_BLOG": return blogSlug ? `/blogs/${blogSlug}` : "/blogs"
  }
}

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case "FOLLOW":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 shrink-0">
          <UserPlus className="h-4 w-4 text-emerald-500" />
        </div>
      )
    case "LIKE_SNIPPET":
    case "LIKE_BLOG":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 shrink-0">
          <Heart className="h-4 w-4 text-rose-500" />
        </div>
      )
    case "COMMENT_SNIPPET":
    case "COMMENT_BLOG":
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 shrink-0">
          <MessageCircle className="h-4 w-4 text-blue-500" />
        </div>
      )
  }
}

function getDateGroup(date: Date): string {
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  if (isThisWeek(date)) return "This Week"
  return "Earlier"
}

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  })

  // Mark all as read on page visit
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  })

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      actor: { select: { id: true, name: true, username: true, image: true } },
      snippet: { select: { id: true, title: true } },
      blog: { select: { id: true, slug: true, title: true } },
    },
  })

  // Group by date bucket
  const groups: Record<string, typeof notifications> = {}
  for (const n of notifications) {
    const group = getDateGroup(new Date(n.createdAt))
    if (!groups[group]) groups[group] = []
    groups[group].push(n)
  }
  const groupOrder = ["Today", "Yesterday", "This Week", "Earlier"]

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay up to date with activity on your content
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 border border-border/60 rounded-full px-3 py-1.5">
            <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
            Marked {unreadCount} as read
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
          <Bell className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">No notifications yet</p>
          <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
            When someone follows you or interacts with your content, you&apos;ll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupOrder.map((groupLabel) => {
            const items = groups[groupLabel]
            if (!items || items.length === 0) return null
            return (
              <div key={groupLabel}>
                {/* Group label */}
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                    {groupLabel}
                  </p>
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-xs text-muted-foreground shrink-0">{items.length}</span>
                </div>

                <div className="space-y-1.5">
                  {items.map((n) => {
                    const actorDisplayName = n.actor.name || n.actor.username || "Someone"
                    const href = notificationHref(
                      n.type as NotificationType,
                      n.actor.username,
                      n.snippet?.id,
                      n.blog?.slug
                    )

                    return (
                      <div key={n.id} className="group">
                        <Card
                          className={cn(
                            "flex items-center gap-3 p-3.5 border-border/60 transition-all hover:border-border hover:shadow-sm",
                            !n.read && "bg-primary/[0.03] border-primary/20"
                          )}
                        >
                          {/* Actor avatar — standalone link */}
                          <Link
                            href={`/profile/${n.actor.username ?? n.actor.id}`}
                            className="shrink-0"
                          >
                            <Avatar className="h-9 w-9 hover:opacity-80 transition-opacity">
                              <AvatarImage src={n.actor.image || ""} />
                              <AvatarFallback className="text-sm">
                                {n.actor.name?.charAt(0) || n.actor.username?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                          </Link>

                          {/* Text — navigates to content */}
                          <Link href={href} className="flex-1 min-w-0">
                            <p className="text-sm leading-snug">
                              {notificationText(
                                n.type as NotificationType,
                                actorDisplayName,
                                n.snippet?.title,
                                n.blog?.title
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </p>
                          </Link>

                          {/* Icon + unread dot */}
                          <div className="flex items-center gap-2 shrink-0">
                            <NotificationIcon type={n.type as NotificationType} />
                            {!n.read && (
                              <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                        </Card>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
