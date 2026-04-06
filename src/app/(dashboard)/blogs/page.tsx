import { prisma } from "@/lib/db/prisma"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Clock, Heart, MessageCircle } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { getCurrentUser } from "@/lib/auth/current-user"
import { SearchFilter } from "@/components/features/search-filter"
import { Pagination } from "@/components/shared/pagination"
import { Suspense } from "react"

const PAGE_SIZE = 12

interface BlogsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const params = await searchParams
  const search = typeof params.search === "string" ? params.search : ""
  const tag = typeof params.tag === "string" ? params.tag : ""
  const pageParam =
    typeof params.page === "string" ? parseInt(params.page, 10) : 1
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam

  const currentUser = await getCurrentUser()

  const where: Record<string, unknown> = { published: true }

  if (tag) {
    where.tags = { has: tag }
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
    ]
  }

  const [blogs, totalCount, popularTagsRaw] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.blog.count({ where }),
    prisma.blog.findMany({
      where: { published: true },
      select: { tags: true },
      orderBy: { publishedAt: "desc" },
      take: 100,
    }),
  ])

  const tagFrequency: Record<string, number> = {}
  for (const b of popularTagsRaw) {
    for (const t of b.tags) {
      tagFrequency[t] = (tagFrequency[t] || 0) + 1
    }
  }
  const popularTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([t]) => t)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

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

      {/* Search & Tag Filter */}
      <Suspense>
        <SearchFilter
          availableTags={popularTags}
          basePath="/blogs"
          showLanguageFilter={false}
          placeholder="Search blog posts by title or excerpt..."
        />
      </Suspense>

      {blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FileText className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No blog posts found</p>
          <p className="text-sm text-muted-foreground mb-4">
            {search || tag
              ? "Try adjusting your search or filters"
              : "Be the first to share your knowledge!"}
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
          <div className="space-y-4">
            {blogs.map((blog) => (
              <Link key={blog.id} href={`/blogs/${blog.slug}`}>
                <Card className="group overflow-hidden border-border/60 transition-all hover:border-border hover:shadow-lg">
                  <div className="flex flex-col sm:flex-row">
                    {blog.coverImage && (
                      <div className="sm:w-64 h-48 sm:h-auto bg-muted relative overflow-hidden shrink-0">
                        <Image
                          src={blog.coverImage}
                          alt={blog.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform group-hover:scale-105"
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
                        {blog.tags.slice(0, 4).map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">
                            {t}
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

          <Suspense>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={PAGE_SIZE}
              basePath="/blogs"
              itemLabel="posts"
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}
