import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
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
    case "FOLLOW":
      return `${actorName} started following you`
    case "LIKE_SNIPPET":
      return `${actorName} liked your snippet${snippetTitle ? ` "${snippetTitle}"` : ""}`
    case "LIKE_BLOG":
      return `${actorName} liked your blog post${blogTitle ? ` "${blogTitle}"` : ""}`
    case "COMMENT_SNIPPET":
      return `${actorName} commented on your snippet${snippetTitle ? ` "${snippetTitle}"` : ""}`
    case "COMMENT_BLOG":
      return `${actorName} commented on${blogTitle ? ` "${blogTitle}"` : " your blog post"}`
  }
}

function notificationHref(
  type: NotificationType,
  actorUsername?: string | null,
  snippetId?: string | null,
  blogSlug?: string | null
): string {
  switch (type) {
    case "FOLLOW":
      return actorUsername ? `/profile/${actorUsername}` : "/feed"
    case "LIKE_SNIPPET":
    case "COMMENT_SNIPPET":
      return snippetId ? `/snippets/${snippetId}` : "/feed"
    case "LIKE_BLOG":
    case "COMMENT_BLOG":
      return blogSlug ? `/blogs/${blogSlug}` : "/blogs"
  }
}

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case "FOLLOW":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10">
          <UserPlus className="h-3.5 w-3.5 text-emerald-500" />
        </div>
      )
    case "LIKE_SNIPPET":
    case "LIKE_BLOG":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/10">
          <Heart className="h-3.5 w-3.5 text-rose-500" />
        </div>
      )
    case "COMMENT_SNIPPET":
    case "COMMENT_BLOG":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10">
          <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
        </div>
      )
  }
}

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

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
      actor: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      snippet: {
        select: { id: true, title: true },
      },
      blog: {
        select: { id: true, slug: true, title: true },
      },
    },
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Stay up to date with activity on your content
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
          <Bell className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No notifications yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            When someone follows you or interacts with your content, you&apos;ll
            see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => {
            const actorDisplayName =
              n.actor.name || n.actor.username || "Someone"
            const href = notificationHref(
              n.type as NotificationType,
              n.actor.username,
              n.snippet?.id,
              n.blog?.slug
            )

            return (
              <Link key={n.id} href={href}>
                <Card
                  className={cn(
                    "flex items-start gap-3 p-4 border-border/60 transition-colors hover:border-border",
                    !n.read && "bg-muted/40"
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={n.actor.image || ""} />
                    <AvatarFallback className="text-sm">
                      {n.actor.name?.charAt(0) ||
                        n.actor.username?.charAt(0) ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {notificationText(
                        n.type as NotificationType,
                        actorDisplayName,
                        n.snippet?.title,
                        n.blog?.title
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <NotificationIcon type={n.type as NotificationType} />
                    {!n.read && (
                      <Badge
                        variant="default"
                        className="h-1.5 w-1.5 rounded-full p-0"
                      />
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
