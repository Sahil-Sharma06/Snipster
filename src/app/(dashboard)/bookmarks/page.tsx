import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import { SnippetCard } from "@/components/shared/snippet-card"
import { BookmarkButton } from "@/components/features/bookmark-button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bookmark,
  Code2,
  FileText,
  Clock,
  Heart,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default async function BookmarksPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const [snippetBookmarks, blogBookmarks] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId: user.id, snippetId: { not: null } },
      orderBy: { createdAt: "desc" },
      include: {
        snippet: {
          include: {
            author: {
              select: { id: true, name: true, username: true, image: true },
            },
            _count: {
              select: { likes: true, comments: true, bookmarks: true },
            },
          },
        },
      },
    }),
    prisma.bookmark.findMany({
      where: { userId: user.id, blogId: { not: null } },
      orderBy: { createdAt: "desc" },
      include: {
        blog: {
          include: {
            author: {
              select: { id: true, name: true, username: true, image: true },
            },
            _count: {
              select: { likes: true, comments: true },
            },
          },
        },
      },
    }),
  ])

  const snippets = snippetBookmarks
    .map((b) => b.snippet!)
    .filter(Boolean)

  const blogs = blogBookmarks
    .map((b) => b.blog!)
    .filter(Boolean)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bookmark className="h-6 w-6" />
          Bookmarks
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Snippets and blog posts you&apos;ve saved for later
        </p>
      </div>

      <Tabs defaultValue="snippets">
        <TabsList>
          <TabsTrigger value="snippets" className="gap-2">
            <Code2 className="h-4 w-4" />
            Snippets
            {snippets.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {snippets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="blogs" className="gap-2">
            <FileText className="h-4 w-4" />
            Blogs
            {blogs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {blogs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Snippets tab ── */}
        <TabsContent value="snippets" className="mt-6">
          {snippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <Code2 className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-1">No bookmarked snippets yet</p>
              <p className="text-sm text-muted-foreground">
                Hit the bookmark icon on any snippet to save it here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {snippets.map((snippet) => (
                <div key={snippet.id} className="relative group/card">
                  <SnippetCard snippet={snippet} />
                  {/* Un-bookmark button overlay */}
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <BookmarkButton
                      snippetId={snippet.id}
                      initialBookmarked={true}
                      initialCount={snippet._count.bookmarks}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Blogs tab ── */}
        <TabsContent value="blogs" className="mt-6">
          {blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <FileText className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-1">No bookmarked blog posts yet</p>
              <p className="text-sm text-muted-foreground">
                Hit the bookmark icon on any blog post to save it here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {blogs.map((blog) => (
                <div key={blog.id} className="relative group/card">
                  <Link href={`/blogs/${blog.slug}`}>
                    <Card className="group overflow-hidden border-border/60 transition-all hover:border-border hover:shadow-lg">
                      <div className="flex flex-col sm:flex-row">
                        {blog.coverImage && (
                          <div className="sm:w-48 h-36 sm:h-auto bg-muted relative overflow-hidden shrink-0">
                            <img
                              src={blog.coverImage}
                              alt={blog.title}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        )}
                        <div className="flex-1 p-5 space-y-2">
                          {/* Author */}
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={blog.author.image || ""} />
                              <AvatarFallback className="text-[10px]">
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
                            <h2 className="font-bold leading-tight group-hover:text-primary transition-colors line-clamp-1">
                              {blog.title}
                            </h2>
                            {blog.excerpt && (
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                {blog.excerpt}
                              </p>
                            )}
                          </div>

                          {/* Tags */}
                          {blog.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {blog.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-5"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {blog.tags.length > 3 && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-5"
                                >
                                  +{blog.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                  {/* Un-bookmark button overlay */}
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <BookmarkButton
                      blogId={blog.id}
                      initialBookmarked={true}
                      initialCount={0}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
