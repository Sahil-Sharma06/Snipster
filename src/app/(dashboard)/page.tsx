import { currentUser } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"

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
    </div>
  )
}