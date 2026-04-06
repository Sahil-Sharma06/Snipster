import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SnippetCard } from "@/components/shared/snippet-card"
import { BlogCard } from "@/components/shared/blog-card"
import { FollowButton } from "@/components/features/follow-button"
import { Pagination } from "@/components/shared/pagination"
import { Code2, Users, Search, FileText } from "lucide-react"
import Link from "next/link"

const PAGE_SIZE = 18

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const q = typeof params.q === "string" ? params.q.trim() : ""
  const type = typeof params.type === "string" ? params.type : "people"
  const pageParam = typeof params.page === "string" ? parseInt(params.page, 10) : 1
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
  const skip = (page - 1) * PAGE_SIZE

  const currentUser = await getCurrentUser()

  const userWhere = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { username: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {}

  const snippetWhere = q
    ? {
        isPublic: true,
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { tags: { has: q.toLowerCase() } },
        ],
      }
    : { isPublic: true }

  const blogWhere = q
    ? {
        published: true,
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { excerpt: { contains: q, mode: "insensitive" as const } },
          { tags: { has: q.toLowerCase() } },
        ],
      }
    : { published: true }

  const authorSelect = { id: true, name: true, username: true, image: true }

  const [users, userTotal, snippets, snippetTotal, blogs, blogTotal] = await Promise.all([
    type === "people"
      ? prisma.user.findMany({
          where: userWhere,
          skip,
          take: PAGE_SIZE,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
            _count: {
              select: {
                snippets: { where: { isPublic: true } },
                followers: true,
              },
            },
            ...(currentUser
              ? {
                  followers: {
                    where: { followerId: currentUser.id },
                    select: { id: true },
                  },
                }
              : {}),
          },
        })
      : Promise.resolve([]),

    type === "people" ? prisma.user.count({ where: userWhere }) : Promise.resolve(0),

    type === "snippets"
      ? prisma.snippet.findMany({
          where: snippetWhere,
          skip,
          take: PAGE_SIZE,
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: authorSelect },
            _count: { select: { likes: true, comments: true, bookmarks: true } },
          },
        })
      : Promise.resolve([]),

    type === "snippets" ? prisma.snippet.count({ where: snippetWhere }) : Promise.resolve(0),

    type === "blogs"
      ? prisma.blog.findMany({
          where: blogWhere,
          skip,
          take: PAGE_SIZE,
          orderBy: { publishedAt: "desc" },
          include: {
            author: { select: authorSelect },
            _count: { select: { likes: true, comments: true } },
          },
        })
      : Promise.resolve([]),

    type === "blogs" ? prisma.blog.count({ where: blogWhere }) : Promise.resolve(0),
  ])

  const totalItems = type === "people" ? userTotal : type === "snippets" ? snippetTotal : blogTotal
  const totalPages = Math.ceil(totalItems / PAGE_SIZE)

  const tabs = [
    { key: "people", label: "People", icon: Users, count: userTotal },
    { key: "snippets", label: "Snippets", icon: Code2, count: snippetTotal },
    { key: "blogs", label: "Blog Posts", icon: FileText, count: blogTotal },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find developers, snippets, and blog posts
        </p>
      </div>

      {/* Search form */}
      <form method="GET" action="/search" className="flex gap-2 max-w-xl">
        <input type="hidden" name="type" value={type} />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            name="q"
            defaultValue={q}
            placeholder={
              type === "people"
                ? "Search by name or username..."
                : type === "snippets"
                ? "Search snippets by title, description or tag..."
                : "Search blog posts by title or excerpt..."
            }
            autoComplete="off"
            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <Button type="submit" size="sm">
          Search
        </Button>
        {q && (
          <Link href={`/search?type=${type}`}>
            <Button type="button" variant="ghost" size="sm">
              Clear
            </Button>
          </Link>
        )}
      </form>

      {/* Type tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <Link key={t.key} href={`/search?type=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>
            <Badge
              variant={type === t.key ? "default" : "outline"}
              className="cursor-pointer gap-1.5 px-3 py-1.5 text-sm"
            >
              <t.icon className="h-3 w-3" />
              {t.label}
              {q && (
                <span className="ml-1 opacity-70">({t.count})</span>
              )}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Result count */}
      {q && (
        <p className="text-sm text-muted-foreground">
          {totalItems === 0
            ? `No ${type} found for "${q}"`
            : `${totalItems} result${totalItems === 1 ? "" : "s"} for "${q}"`}
        </p>
      )}

      {/* People results */}
      {type === "people" && (
        <>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <Users className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{q ? `No people found for "${q}"` : "No users found"}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => {
                const isFollowing =
                  "followers" in user &&
                  Array.isArray(user.followers) &&
                  user.followers.length > 0
                const isSelf = currentUser?.id === user.id

                return (
                  <Card
                    key={user.id}
                    className="p-4 border-border/60 hover:border-border transition-all hover:shadow-md flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/profile/${user.username ?? user.id}`}
                        className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={user.image ?? ""} />
                          <AvatarFallback>
                            {user.name?.charAt(0) ?? user.username?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold truncate leading-tight">
                            {user.name ?? user.username ?? "Anonymous"}
                          </p>
                          {user.username && (
                            <p className="text-xs text-muted-foreground truncate">
                              @{user.username}
                            </p>
                          )}
                        </div>
                      </Link>
                      {!isSelf && (
                        <FollowButton
                          targetUserId={user.id}
                          initialFollowing={isFollowing}
                          isLoggedIn={!!currentUser}
                        />
                      )}
                    </div>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                      <span className="flex items-center gap-1">
                        <Code2 className="h-3 w-3" />
                        {user._count.snippets} {user._count.snippets === 1 ? "snippet" : "snippets"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {user._count.followers} {user._count.followers === 1 ? "follower" : "followers"}
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Snippet results */}
      {type === "snippets" && (
        <>
          {snippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <Code2 className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{q ? `No snippets found for "${q}"` : "No snippets yet"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(snippets as any[]).map((snippet) => (
                <SnippetCard key={snippet.id} snippet={snippet} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Blog results */}
      {type === "blogs" && (
        <>
          {blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <FileText className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{q ? `No blog posts found for "${q}"` : "No blog posts yet"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(blogs as any[]).map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </>
      )}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          basePath={`/search?type=${type}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          itemLabel={type}
        />
      )}
    </div>
  )
}
