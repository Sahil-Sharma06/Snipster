"use client"

import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { NotificationBell } from "@/components/features/notification-bell"

export function DashboardHeader() {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 flex justify-between items-center h-16 px-8 bg-[#131313]/70 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <Link href="/search">
            <input
              className="w-full bg-surface-container-lowest border-none rounded-full py-2 pl-10 pr-4 text-sm font-body text-on-surface focus:ring-1 ring-[#C0C1FF]/40 transition-all cursor-pointer"
              placeholder="Search the monolith..."
              type="text"
              readOnly
            />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-8">
        <Link href="/notifications" className="p-2 text-[#C7C4D7] hover:text-white transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </Link>
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="h-8 w-8 rounded-full flex items-center justify-center border-subtle overflow-hidden">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: { avatarBox: "h-8 w-8 object-cover" },
              }}
            />
          </div>
          <span className="material-symbols-outlined text-[#C7C4D7]">account_circle</span>
        </div>
      </div>
    </header>
  )
}