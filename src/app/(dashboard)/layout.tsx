import { DashboardHeader } from "@/components/layouts/dashboard-header"
import { DashboardNav } from "@/components/layouts/dashboard-nav"
import { MobileNav } from "@/components/layouts/mobile-nav"
import { Toaster } from "@/components/ui/sonner"

export const dynamic = "force-dynamic"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#131313] font-['Inter']">
      <DashboardHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col gap-2 p-4 h-screen w-64 border-r border-white/5 bg-[#131313] fixed left-0 top-0 text-sm tracking-wide uppercase font-bold z-[60]">
          <DashboardNav />
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 mt-16 px-4 md:px-6 lg:px-12 py-12 bg-surface min-w-0 min-h-[calc(100vh-64px)] pb-24 md:pb-12 text-[#e5e2e1]">
          {children}
        </main>
      </div>

      <MobileNav />
      <Toaster />
    </div>
  )
}
