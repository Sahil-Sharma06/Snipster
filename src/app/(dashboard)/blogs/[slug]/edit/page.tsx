import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { notFound, redirect } from "next/navigation"
import { EditBlogForm } from "@/components/forms/edit-blog-form"

interface EditBlogPageProps {
  params: Promise<{ slug: string }>
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { slug } = await params
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/sign-in")
  }

  const blog = await prisma.blog.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      coverImage: true,
      tags: true,
      published: true,
      authorId: true,
    },
  })

  if (!blog) {
    notFound()
  }

  // Only the author can edit their blog
  if (blog.authorId !== currentUser.id) {
    redirect(`/blogs/${slug}`)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Blog Post</h1>
        <p className="text-sm text-muted-foreground">
          Make changes to your blog post
        </p>
      </div>
      <EditBlogForm blog={blog} />
    </div>
  )
}
