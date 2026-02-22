import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { EditProfileForm } from "@/components/forms/edit-profile-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function EditProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      username: true,
      bio: true,
      websiteUrl: true,
      githubUrl: true,
      twitterUrl: true,
    },
  })

  if (!fullUser) redirect("/sign-in")

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update your public profile information
        </p>
      </div>

      <Separator />

      <Card className="p-6 border-border/60">
        <EditProfileForm user={fullUser} />
      </Card>
    </div>
  )
}
