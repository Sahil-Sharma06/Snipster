"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Code2,
  Rss,
  Plus,
  User,
  FolderOpen,
  Menu,
  FileCode,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

const navigation = [
  { name: "Feed", href: "/feed", icon: Rss },
  { name: "My Snippets", href: "/my-snippets", icon: FileCode },
  { name: "Create Snippet", href: "/snippets/new", icon: Plus },
  { name: "Collections", href: "/collections", icon: FolderOpen },
  { name: "Profile", href: "/profile", icon: User },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-left">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Code2 className="h-3.5 w-3.5" />
            </div>
            Snipster
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-4">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/feed" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
        <div className="p-4">
          <Link href="/snippets/new" onClick={() => setOpen(false)}>
            <Button className="w-full" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Snippet
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
