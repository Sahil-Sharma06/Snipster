import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { Code2, Search } from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { MobileNav } from "@/components/layouts/mobile-nav"
import { NotificationBell } from "@/components/features/notification-bell"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center gap-3 px-4 mx-auto">

        {/* Mobile menu */}
        <MobileNav />

        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-lg shrink-0"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Code2 className="h-3.5 w-3.5" />
          </div>
          <span className="hidden sm:inline tracking-tight">Snipster</span>
        </Link>

        {/* Search bar — navigates to /search */}
        <Link
          href="/search"
          className="hidden md:flex items-center gap-2 h-8 flex-1 max-w-xs rounded-lg border border-border/60 bg-muted/40 px-3 text-sm text-muted-foreground hover:bg-muted hover:border-border transition-all cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">Search snippets, blogs, people…</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            /
          </kbd>
        </Link>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <NotificationBell />
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: { avatarBox: "h-8 w-8" },
            }}
          />
        </div>
      </div>
    </header>
  )
}
