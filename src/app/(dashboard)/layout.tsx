import { DashboardHeader } from "@/components/layouts/dashboard-header"
import { DashboardNav } from "@/components/layouts/dashboard-nav"
import { Toaster } from "@/components/ui/sonner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 px-4 py-6">
        <aside className="fixed top-16 z-30 hidden h-[calc(100vh-4rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block md:w-[220px] lg:w-[240px] py-6 pr-6">
          <DashboardNav />
        </aside>
        <main className="flex-1">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
