"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const mobileNavItems = [
  { name: "FEED", href: "/feed", icon: "group" },
  { name: "SNIPS", href: "/my-snippets", icon: "code" },
  { name: "CREATE", href: "/snippets/new", icon: "add", isCenter: true },
  { name: "BLOGS", href: "/my-blogs", icon: "article" },
  { name: "PROFILE", href: "/profile", icon: "person" },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#131313]/90 backdrop-blur-xl border-t border-white/5 h-16 flex items-center justify-around z-[60] px-4 font-body">
      {mobileNavItems.map((item) => {
        const activeCond = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

        if (item.isCenter) {
          return (
            <Link key={item.name} href={item.href} className="w-12 h-12 gradient-button text-black rounded-full flex items-center justify-center -mt-8 shadow-xl hover:scale-105 transition-transform z-10">
              <span className="material-symbols-outlined text-black">add</span>
            </Link>
          )
        }

        return (
          <Link key={item.name} href={item.href} className={`flex flex-col items-center gap-1 transition-colors ${activeCond ? 'text-[#C0C1FF]' : 'text-[#C7C4D7] hover:text-white'}`}>
             <span className="material-symbols-outlined" style={{ fontVariationSettings: activeCond ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
             <span className="text-[10px] font-bold tracking-widest">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}