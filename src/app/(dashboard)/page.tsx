import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/current-user"

export default async function DashboardRootPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  redirect("/dashboard")
}
