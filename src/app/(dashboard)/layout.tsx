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
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-body antialiased selection:bg-primary selection:text-on-primary">
      {/* SideNavBar */}
      <aside className="hidden md:flex flex-col py-8 px-4 h-screen w-24 border-r border-white/5 bg-[#0e0e0e] fixed left-0 top-0 z-50">
        <DashboardNav />
      </aside>

      {/* TopNavBar */}
      <DashboardHeader />

      {/* Main Content */}
      <main className="ml-0 md:ml-24 pt-32 md:pt-36 px-6 md:px-10 pb-24 md:pb-12 min-h-screen">
        {children}
      </main>

      <MobileNav />
      <Toaster />
    </div>
  )
}