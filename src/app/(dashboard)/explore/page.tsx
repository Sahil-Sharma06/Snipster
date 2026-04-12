import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SnippetCard } from "@/components/shared/snippet-card"
import { BlogCard } from "@/components/shared/blog-card"
import { FollowButton } from "@/components/features/follow-button"
import { Pagination } from "@/components/shared/pagination"
import { Code2, Users, Search, FileText, Compass } from "lucide-react"
import Link from "next/link"

const PAGE_SIZE = 18

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const q = typeof params.q === "string" ? params.q.trim() : ""
  const rawType = typeof params.type === "string" ? params.type.toLowerCase().trim() : "people"
  const type =
    rawType === "people" || rawType === "users"
      ? "people"
      : rawType === "snippets" || rawType === "snippet"
      ? "snippets"
      : rawType === "blogs" || rawType === "blog" || rawType === "blog-posts"
      ? "blogs"
      : "people"
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

  const searchPlaceholder =
    type === "people"
      ? "Search by name or username..."
      : type === "snippets"
      ? "Search snippets by title, description or tag..."
      : "Search blog posts by title or excerpt..."

  return (
    <div className="font-body antialiased w-full max-w-375 mx-auto -mt-6 relative overflow-hidden">
      <style>{`
        @keyframes searchEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes searchCardIn {
          from { opacity: 0; transform: translateY(10px) scale(0.996); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .search-enter { animation: searchEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .search-card-in { animation: searchCardIn 420ms cubic-bezier(0.22, 1, 0.36, 1) both; }

        @media (prefers-reduced-motion: reduce) {
          .search-enter,
          .search-card-in { animation: none !important; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#c0c1ff]/10 blur-[110px]" />
      </div>

      <header className="search-enter mb-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">Discovery</p>
        <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-white tracking-tight">Explore</h1>
        <p className="text-sm text-on-surface-variant mt-2">Find developers, snippets, and blog posts</p>
      </header>

      <div className="search-enter mb-6" style={{ animationDelay: "50ms" }}>
        <form method="GET" action="/explore" className="flex gap-2 max-w-2xl">
          <input type="hidden" name="type" value={type} />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
            <input
              name="q"
              defaultValue={q}
              placeholder={searchPlaceholder}
              autoComplete="off"
              className="h-11 w-full rounded-md border border-white/10 bg-surface-container-low pl-10 pr-3 text-sm text-white transition-colors placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>
          <Button type="submit" size="sm" className="h-11 px-6 beam-button rounded-md text-white! hover:text-white! focus-visible:text-white! border border-white/10">
            <Compass className="relative z-1 h-4 w-4 text-white" aria-hidden="true" />
          </Button>
          {q && (
            <Link href={`/explore?type=${type}`}>
              <Button type="button" variant="ghost" size="sm" className="h-11 px-4 rounded-md text-on-surface-variant hover:text-white hover:bg-white/5">
                Clear
              </Button>
            </Link>
          )}
        </form>
      </div>

      <div className="search-enter mb-8 flex flex-wrap gap-2 p-1 bg-surface-container-low border border-white/5 rounded-md w-fit" style={{ animationDelay: "90ms" }}>
        {tabs.map((t) => (
          <Link key={t.key} href={`/explore?type=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`px-4 py-2 rounded-sm text-[11px] font-bold uppercase tracking-[0.15em] transition-colors ${type === t.key ? "bg-white/10 text-primary" : "text-on-surface-variant hover:text-white"}`}>
            <span className="inline-flex items-center gap-1.5">
              <t.icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
              {q && <span className="opacity-80">({t.count})</span>}
            </span>
          </Link>
        ))}
      </div>

      {q && (
        <p className="search-enter mb-6 text-sm text-on-surface-variant" style={{ animationDelay: "120ms" }}>
          {totalItems === 0
            ? `No ${type} found for "${q}"`
            : `${totalItems} result${totalItems === 1 ? "" : "s"} for "${q}"`}
        </p>
      )}

      {/* People results */}
      {type === "people" && (
        <>
          {users.length === 0 ? (
            <div className="search-enter flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-surface-container-low py-16">
              <Users className="h-10 w-10 text-on-surface-variant mb-4" />
              <p className="text-on-surface-variant">{q ? `No people found for "${q}"` : "No users found"}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user, index) => {
                const isFollowing =
                  "followers" in user &&
                  Array.isArray(user.followers) &&
                  user.followers.length > 0
                const isSelf = currentUser?.id === user.id

                return (
                  <Card
                    key={user.id}
                    className="search-card-in p-4 bg-surface border border-outline-variant/10 hover:border-[#c0c1ff]/30 transition-all duration-300 hover:-translate-y-0.5 flex flex-col gap-3"
                    style={{ animationDelay: `${Math.min(index * 45, 260)}ms` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/profile/${user.username ?? user.id}`}
                        className="flex items-center gap-3 min-w-0 hover:opacity-90 transition-opacity"
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={user.image ?? ""} />
                          <AvatarFallback>
                            {user.name?.charAt(0) ?? user.username?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate leading-tight">
                            {user.name ?? user.username ?? "Anonymous"}
                          </p>
                          {user.username && (
                            <p className="text-xs text-on-surface-variant truncate">
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
                      <p className="text-sm text-on-surface-variant line-clamp-2">{user.bio}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-auto">
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
            <div className="search-enter flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-surface-container-low py-16">
              <Code2 className="h-10 w-10 text-on-surface-variant mb-4" />
              <p className="text-on-surface-variant">{q ? `No snippets found for "${q}"` : "No snippets yet"}</p>
            </div>
          ) : (
            <div className="search-enter grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" style={{ animationDelay: "120ms" }}>
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
            <div className="search-enter flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-surface-container-low py-16">
              <FileText className="h-10 w-10 text-on-surface-variant mb-4" />
              <p className="text-on-surface-variant">{q ? `No blog posts found for "${q}"` : "No blog posts yet"}</p>
            </div>
          ) : (
            <div className="search-enter grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" style={{ animationDelay: "120ms" }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(blogs as any[]).map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </>
      )}

      {totalPages > 1 && (
        <div className="search-enter" style={{ animationDelay: "150ms" }}>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            basePath={`/explore?type=${type}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            itemLabel={type}
          />
        </div>
      )}
    </div>
  )
}
