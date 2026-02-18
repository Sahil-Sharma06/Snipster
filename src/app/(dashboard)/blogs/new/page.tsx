import { requireUser } from "@/lib/auth/current-user"
import { CreateBlogForm } from "@/components/forms/create-blog-form"

export default async function NewBlogPage() {
  await requireUser()

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Blog Post</h1>
        <p className="text-sm text-muted-foreground">
          Share your knowledge and experiences with the community
        </p>
      </div>
      <CreateBlogForm />
    </div>
  )
}
