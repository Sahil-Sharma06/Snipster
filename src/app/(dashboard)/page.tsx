import { currentUser } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const user = await currentUser()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
      <p className="mt-4">Welcome, {user?.firstName || user?.username}!</p>
      <p className="text-sm text-gray-600">
        {user?.emailAddresses[0]?.emailAddress}
      </p>

      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="flex gap-4">
          <Link href="/snippets/new">
            <Button>Create New Snippet</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}