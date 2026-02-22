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
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar — hidden on mobile, visible md+ */}
          <aside className="hidden md:block w-55 shrink-0 border-r border-border pr-6">
            <div className="sticky top-20">
              <DashboardNav />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 w-full">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
