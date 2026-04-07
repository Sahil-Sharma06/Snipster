"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Feed", href: "/feed", icon: "dynamic_feed" },
  { name: "Snippets", href: "/my-snippets", icon: "code" },
  { name: "Blogs", href: "/my-blogs", icon: "article" },
  { name: "Collections", href: "/collections", icon: "auto_awesome_motion" },
  { name: "Search", href: "/search", icon: "search" },
  { name: "Profile", href: "/profile", icon: "person" },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <>
      <div className="flex items-center gap-3 px-2 py-4 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-[#d2bbff] to-[#7c3aed] rounded-xl flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
        </div>
        <div>
          <div className="text-lg font-black text-[#D2BBFF] tracking-tighter normal-case leading-none">Snipster</div>
          <div className="text-[10px] text-zinc-500 tracking-widest leading-none mt-1 uppercase">The Kinetic Archive</div>
        </div>
      </div>
      
      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/feed" && item.href !== "/snippets" && item.href !== "/blogs" && item.href !== "/collections" && item.href !== "/profile" && item.href !== "/search" && pathname.startsWith(item.href))
            || (item.href === "/dashboard" && pathname === item.href)
            || (item.href !== "/dashboard" && pathname.startsWith(item.href)) // refined logic
          
          const activeCond = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 rounded-xl ${
                activeCond 
                  ? "text-[#D2BBFF] bg-[#2A2A2A] ease-out" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-[#1B1B1C]"
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeCond ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <Link href="/snippets/new" className="mt-8 mx-2 bg-[#7c3aed] text-white py-3 rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-24 shadow-lg shadow-[#7c3aed]/20">
        <span className="material-symbols-outlined">add</span>
        <span className="normal-case text-xs uppercase tracking-widest font-bold">Create New</span>
      </Link>
    </>
  )
}
