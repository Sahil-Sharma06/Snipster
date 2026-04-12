import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { EditProfileForm } from "@/components/forms/edit-profile-form"

export default async function EditProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      image: true,
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
    <div className="w-full max-w-375 mx-auto -mt-8 md:-mt-10">
      <div className="grid grid-cols-1">
        <section className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-6 md:p-8">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight text-white mb-2">General Settings</h1>
            <p className="text-on-surface-variant text-sm md:text-base max-w-2xl">
              Customize your profile appearance and personal information so others can identify you in the community.
            </p>
          </header>

          <EditProfileForm user={fullUser} />
        </section>
      </div>
    </div>
  )
}
