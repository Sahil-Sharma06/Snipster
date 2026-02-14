"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Code2, Home, Plus, User, BookMarked } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Feed", href: "/feed", icon: Code2 },
  { name: "Create Snippet", href: "/snippets/new", icon: Plus },
  { name: "Collections", href: "/collections", icon: BookMarked },
  { name: "Profile", href: "/profile", icon: User },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
