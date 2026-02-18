import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { Code2 } from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { MobileNav } from "@/components/layouts/mobile-nav"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container flex h-14 items-center gap-4 px-4">
        <MobileNav />
        <Link
          href="/feed"
          className="flex items-center gap-2 font-bold text-lg"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Code2 className="h-3.5 w-3.5" />
          </div>
          <span className="hidden sm:inline">Snipster</span>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  )
}
