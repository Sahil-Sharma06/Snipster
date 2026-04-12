import { requireUser } from "@/lib/auth/current-user"
import { CreateBlogForm } from "@/components/forms/create-blog-form"

export default async function NewBlogPage() {
  await requireUser()

  return (
    <div className="w-full max-w-375 mx-auto -mt-8 md:-mt-10">
      <CreateBlogForm />
    </div>
  )
}
