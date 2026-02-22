"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Rss,
  Plus,
  User,
  FolderOpen,
  FileCode,
  FileText,
  Bookmark,
  Bell,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navigation = [
  { name: "Feed", href: "/feed", icon: Rss },
  { name: "My Snippets", href: "/my-snippets", icon: FileCode },
  { name: "My Blogs", href: "/my-blogs", icon: FileText },
  { name: "Collections", href: "/collections", icon: FolderOpen },
  { name: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { name: "Blogs", href: "/blogs", icon: FileText },
  { name: "Discover", href: "/search", icon: Users },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Profile", href: "/profile", icon: User },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-col gap-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/feed" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <Separator />
      <Link href="/snippets/new">
        <Button className="w-full" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Snippet
        </Button>
      </Link>
    </div>
  )
}
