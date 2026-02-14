import { prisma } from "@/lib/db/prisma"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/current-user"
import { EditSnippetForm } from "@/components/forms/edit-snippet-form"

interface EditSnippetPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditSnippetPage({ params }: EditSnippetPageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const snippet = await prisma.snippet.findUnique({
    where: { id },
  })

  if (!snippet) {
    notFound()
  }

  // Check if user is the author
  if (snippet.authorId !== user.id) {
    redirect(`/snippets/${id}`)
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Snippet</h1>
        <p className="text-muted-foreground">
          Update your code snippet
        </p>
      </div>

      <EditSnippetForm snippet={snippet} />
    </div>
  )
}
