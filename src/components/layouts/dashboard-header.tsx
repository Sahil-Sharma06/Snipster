import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { NotificationBell } from "@/components/features/notification-bell"

export function DashboardHeader() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#202020]/70 backdrop-blur-xl flex items-center justify-between px-6 md:pr-8 md:pl-[18rem] h-16 shadow-[0px_20px_40px_rgba(0,0,0,0.4)] tracking-tight">
      <div className="flex items-center gap-8 pl-0 lg:pl-0">
        <span className="text-xl font-black tracking-tighter text-[#D2BBFF] md:hidden">Snipster</span>
        
        <Link href="/search" className="hidden lg:flex items-center bg-[#131313] rounded-full px-4 py-1.5 border border-white/5 hover:bg-[#1b1b1c] transition-colors cursor-pointer text-zinc-500 relative">
          <span className="material-symbols-outlined text-sm mr-2 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">search</span>
          <input 
            className="bg-transparent border-none pl-6 pr-4 py-0 text-sm w-64 focus:ring-0 transition-all text-[#e5e2e1] focus:outline-none placeholder-zinc-600" 
            placeholder="Search the archive..." 
            type="text"
            readOnly
          />
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        <Link href="/search" className="text-zinc-400 hover:bg-white/5 p-2 rounded-full lg:hidden block">
          <span className="material-symbols-outlined text-sm">search</span>
        </Link>
        <div className="scale-90 text-zinc-400">
          <NotificationBell />
        </div>
        <div className="scale-90 text-zinc-400">
          <ThemeToggle />
        </div>
        <div className="h-8 w-8 rounded-full flex items-center justify-center border border-white/10 shadow-sm overflow-hidden bg-surface-container-high ml-1 hover:scale-95 transition-transform cursor-pointer">
          <UserButton
             afterSignOutUrl="/"
             appearance={{
               elements: { avatarBox: "h-8 w-8 object-cover" },
             }}
           />
        </div>
      </div>
    </nav>
  )
}
