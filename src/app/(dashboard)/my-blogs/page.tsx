import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Clock, Globe, Lock, Pencil, Eye } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { BlogDeleteButton } from "@/components/features/blog-delete-button"

export default async function MyBlogsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const blogs = await prisma.blog.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  })

  const publishedCount = blogs.filter((b) => b.published).length
  const draftCount = blogs.filter((b) => !b.published).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Blog Posts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your published posts and drafts
          </p>
        </div>
        <Link href="/blogs/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          {blogs.length} total
        </div>
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <Globe className="h-4 w-4" />
          {publishedCount} published
        </div>
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <Lock className="h-4 w-4" />
          {draftCount} drafts
        </div>
      </div>

      {blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FileText className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            You haven&apos;t written any blog posts yet
          </p>
          <Link href="/blogs/new">
            <Button size="sm" variant="outline">
              Write your first post
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {blogs.map((blog) => (
            <Card
              key={blog.id}
              className="p-4 border-border/60 hover:border-border transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold truncate">{blog.title}</h3>
                    <Badge
                      variant={blog.published ? "default" : "secondary"}
                      className="text-xs shrink-0"
                    >
                      {blog.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  {blog.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {blog.excerpt}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {blog.readTime ? `${blog.readTime} min read` : "—"}
                    </span>
                    {blog.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    <span className="text-muted-foreground">
                      {blog.published && blog.publishedAt
                        ? `Published ${formatDistanceToNow(new Date(blog.publishedAt), { addSuffix: true })}`
                        : `Updated ${formatDistanceToNow(new Date(blog.updatedAt), { addSuffix: true })}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {blog.published && (
                    <Link href={`/blogs/${blog.slug}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    </Link>
                  )}
                  <Link href={`/blogs/${blog.slug}/edit`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <BlogDeleteButton blogId={blog.id} slug={blog.slug} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
