"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "My Snippets", href: "/my-snippets", icon: "code" },
  { name: "My Blogs", href: "/my-blogs", icon: "article" },
  { name: "Community Feed", href: "/feed", icon: "group" },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <>
      <div className="flex items-center gap-3 mb-10 px-2">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWOQbf2fVnBsky36ykjRC2bjLPSxndai9M-nJmk4Dd-veLkXVgc-gfwbM20vaZHPiHM--97P1r6zD7-RoE21quwQF2dwKjQuhBhcVcZ5EqODJkj5sZ__PvfvwIEgGN8HWyN_5qCD8Ar5vAqTID1cZrX-oMwRXSnL4xsNH99CAKXDBrQ4cX6EW2SyvNfEQQ_V_EwGNRcqS5wKxhCkDnD75M_hRgyUjT3E1V1S5AGBrKPJ1KQoHd0ik5qUfGIhEhNhUIxTvCLkIG8c8"
          alt="Snipster Logo"
          width={32}
          height={32}
          className="w-8 h-8 rounded-lg"
        />
        <div>
          <h1 className="text-xl font-bold tracking-tighter text-white font-headline">Snipster</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60 font-medium">Developer Workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-headline text-sm transition-all active:scale-95 ${
                isActive
                  ? "text-[#C0C1FF] font-bold bg-surface-container-high"
                  : "text-[#C7C4D7] font-medium hover:bg-[#2A2A2A]"
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-headline text-sm transition-colors ${
            pathname === "/settings"
              ? "text-[#C0C1FF] font-bold bg-surface-container-high"
              : "text-[#C7C4D7] font-medium hover:bg-[#2A2A2A]"
          }`}
        >
          <span className="material-symbols-outlined">settings</span>
          Settings
        </Link>
      </div>
    </>
  )
}