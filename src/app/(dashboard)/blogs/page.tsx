import { prisma } from "@/lib/db/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Calendar, Clock, Heart, MessageCircle, Eye } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { getCurrentUser } from "@/lib/auth/current-user"

export default async function BlogsPage() {
  const currentUser = await getCurrentUser()

  const blogs = await prisma.blog.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-sm text-muted-foreground">
            Discover articles and tutorials from the community
          </p>
        </div>
        {currentUser && (
          <Link href="/blogs/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </Link>
        )}
      </div>

      {blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FileText className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No blog posts yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Be the first to share your knowledge!
          </p>
          {currentUser && (
            <Link href="/blogs/new">
              <Button size="sm" variant="outline">
                Create a blog post
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {blogs.map((blog) => (
            <Link key={blog.id} href={`/blogs/${blog.slug}`}>
              <Card className="group overflow-hidden border-border/60 transition-all hover:border-border hover:shadow-lg">
                <div className="flex flex-col sm:flex-row">
                  {blog.coverImage && (
                    <div className="sm:w-64 h-48 sm:h-auto bg-muted relative overflow-hidden">
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-6 space-y-3">
                    {/* Author */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={blog.author.image || ""} />
                        <AvatarFallback className="text-xs">
                          {blog.author.name?.charAt(0) ||
                            blog.author.username?.charAt(0) ||
                            "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {blog.author.name || blog.author.username}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {blog.publishedAt
                          ? formatDistanceToNow(new Date(blog.publishedAt), {
                              addSuffix: true,
                            })
                          : formatDistanceToNow(new Date(blog.createdAt), {
                              addSuffix: true,
                            })}
                      </span>
                    </div>

                    {/* Title & Excerpt */}
                    <div>
                      <h2 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                        {blog.title}
                      </h2>
                      {blog.excerpt && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {blog.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {blog.tags.slice(0, 4).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {blog.tags.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{blog.tags.length - 4}
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                      {blog.readTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {blog.readTime} min read
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {blog._count.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {blog._count.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
