"use client"

import { useEffect, useState, useTransition } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"

type NotificationType =
  | "FOLLOW"
  | "LIKE_SNIPPET"
  | "LIKE_BLOG"
  | "COMMENT_SNIPPET"
  | "COMMENT_BLOG"

interface Notification {
  id: string
  type: NotificationType
  read: boolean
  createdAt: string
  actor: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
  snippet: { id: string; title: string } | null
  blog: { id: string; slug: string; title: string } | null
}

function notificationText(n: Notification): string {
  const actor = n.actor.name || n.actor.username || "Someone"
  switch (n.type) {
    case "FOLLOW":
      return `${actor} started following you`
    case "LIKE_SNIPPET":
      return `${actor} liked your snippet${n.snippet ? ` "${n.snippet.title}"` : ""}`
    case "LIKE_BLOG":
      return `${actor} liked your blog post${n.blog ? ` "${n.blog.title}"` : ""}`
    case "COMMENT_SNIPPET":
      return `${actor} commented on your snippet${n.snippet ? ` "${n.snippet.title}"` : ""}`
    case "COMMENT_BLOG":
      return `${actor} commented on${n.blog ? ` "${n.blog.title}"` : " your blog post"}`
  }
}

function notificationHref(n: Notification): string {
  switch (n.type) {
    case "FOLLOW":
      return n.actor.username ? `/profile/${n.actor.username}` : "/feed"
    case "LIKE_SNIPPET":
    case "COMMENT_SNIPPET":
      return n.snippet ? `/snippets/${n.snippet.id}` : "/feed"
    case "LIKE_BLOG":
    case "COMMENT_BLOG":
      return n.blog ? `/blogs/${n.blog.slug}` : "/blogs"
  }
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && unreadCount > 0) {
      // Mark all as read when the dropdown opens
      startTransition(async () => {
        await fetch("/api/notifications", { method: "PATCH" })
        setUnreadCount(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      })
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-[10px] leading-none flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Link
              href="/notifications"
              className="text-xs font-normal text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <DropdownMenuItem key={n.id} asChild>
              <Link
                href={notificationHref(n)}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  !n.read && "bg-muted/50"
                )}
              >
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarImage src={n.actor.image || ""} />
                  <AvatarFallback className="text-xs">
                    {n.actor.name?.charAt(0) ||
                      n.actor.username?.charAt(0) ||
                      "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{notificationText(n)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!n.read && (
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </Link>
            </DropdownMenuItem>
          ))
        )}
        {notifications.length > 8 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/notifications"
                className="justify-center text-xs text-muted-foreground"
              >
                View all {notifications.length} notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
