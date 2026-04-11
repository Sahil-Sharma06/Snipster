"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { name: "Dash", href: "/dashboard", icon: "grid_view" },
  { name: "Snips", href: "/my-snippets", icon: "code" },
  { name: "Blogs", href: "/my-blogs", icon: "description" },
  { name: "Feed", href: "/feed", icon: "public" },
  { name: "Marks", href: "/bookmarks", icon: "bookmark" },
  { name: "Cols", href: "/collections", icon: "folder" },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <div className="h-full flex flex-col items-center w-full">
      <div className="mb-12 flex flex-col items-center">
        <div className="w-8 h-8 bg-white flex items-center justify-center rounded-sm mb-2">
          <span className="text-black font-black text-xs">S</span>
        </div>
        <p className="text-[8px] uppercase tracking-[0.2em] text-neutral-600 font-bold">Tier 1</p>
      </div>

      <nav className="flex-1 w-full flex flex-col items-center gap-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              aria-label={item.name}
              className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all group ${
                isActive
                  ? "text-white bg-white/4"
                  : "text-neutral-500 hover:text-white hover:bg-white/2"
              }`}
            >
              {isActive && <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full" />}
              <span className="material-symbols-outlined text-[22px] leading-none" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span className={`absolute -bottom-3 text-[9px] uppercase tracking-tight transition-opacity ${isActive ? "font-bold opacity-100" : "font-medium opacity-0 group-hover:opacity-80"}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center pb-2 w-full">
        <div className="flex flex-col items-center space-y-5">
          <Link href="/profile" className="text-neutral-500 hover:text-white transition-colors" aria-label="Profile" title="Profile">
            <span className="material-symbols-outlined text-[20px] leading-none">person</span>
          </Link>
        </div>
      </div>
    </div>
  )
}