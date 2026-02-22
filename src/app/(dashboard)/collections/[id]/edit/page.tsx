import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { notFound, redirect } from "next/navigation"
import { EditCollectionForm } from "@/components/forms/edit-collection-form"

interface EditCollectionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCollectionPage({ params }: EditCollectionPageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) redirect("/sign-in")

  const collection = await prisma.collection.findUnique({ where: { id } })

  if (!collection) notFound()

  if (collection.userId !== user.id) redirect(`/collections/${id}`)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Collection</h1>
        <p className="text-sm text-muted-foreground">
          Update your collection&apos;s name, description or visibility
        </p>
      </div>
      <EditCollectionForm collection={collection} />
    </div>
  )
}
