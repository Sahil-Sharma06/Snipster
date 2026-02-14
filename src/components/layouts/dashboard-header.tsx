import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { Code2 } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Code2 className="h-6 w-6" />
          <span>Snipster</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </header>
  )
}
