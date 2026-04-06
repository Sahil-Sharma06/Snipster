import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { SnippetCard } from "@/components/shared/snippet-card"
import { BlogCard } from "@/components/shared/blog-card"
import { SearchFilter } from "@/components/features/search-filter"
import { Pagination } from "@/components/shared/pagination"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Code2, Heart, Users, FolderOpen, FileText,
  Hash, TrendingUp, Flame, ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"
import { FeedTabs } from "@/components/features/feed-tabs"
import { SortSelector, type SortOption } from "@/components/features/sort-selector"
import { ContentTypeSelector, type ContentType } from "@/components/features/content-type-selector"

const PAGE_SIZE = 18

// "Hot" threshold: 3+ likes in the last 48 hours
const HOT_THRESHOLD = 3
const HOT_WINDOW_MS = 48 * 60 * 60 * 1000

interface FeedPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams
  const search = typeof params.search === "string" ? params.search : ""
  const language = typeof params.language === "string" ? params.language : ""
  const tag = typeof params.tag === "string" ? params.tag : ""
  const tab = typeof params.tab === "string" ? params.tab : "everyone"
  const rawSort = typeof params.sort === "string" ? params.sort : "latest"
  const sort: SortOption = ["latest", "popular", "viewed", "discussed"].includes(rawSort)
    ? (rawSort as SortOption)
    : "latest"
  const rawType = typeof params.type === "string" ? params.type : "all"
  const type: ContentType = ["all", "snippets", "blogs"].includes(rawType)
    ? (rawType as ContentType)
    : "all"
  const pageParam = typeof params.page === "string" ? parseInt(params.page, 10) : 1
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam

  const currentUserData = await getCurrentUser()
  const isFollowingTab = tab === "following" && !!currentUserData

  // ── shared ordering ──────────────────────────────────────────────────
  const snippetOrderBy =
    sort === "popular" ? { likes: { _count: "desc" as const } }
    : sort === "viewed" ? { views: "desc" as const }
    : sort === "discussed" ? { comments: { _count: "desc" as const } }
    : { createdAt: "desc" as const }

  const blogOrderBy =
    sort === "popular" ? { likes: { _count: "desc" as const } }
    : sort === "viewed" ? { views: "desc" as const }
    : sort === "discussed" ? { comments: { _count: "desc" as const } }
    : { publishedAt: "desc" as const }

  // ── following filter ─────────────────────────────────────────────────
  let followingIds: string[] = []
  if (isFollowingTab) {
    const follows = await prisma.follow.findMany({
      where: { followerId: currentUserData!.id },
      select: { followingId: true },
    })
    followingIds = follows.map((f) => f.followingId)
  }

  // ── snippet where ────────────────────────────────────────────────────
  const snippetWhere: Record<string, unknown> = { isPublic: true }
  if (language) snippetWhere.language = language
  if (tag) snippetWhere.tags = { has: tag }
  if (search) {
    snippetWhere.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }
  if (isFollowingTab) snippetWhere.authorId = { in: followingIds }

  // ── blog where ───────────────────────────────────────────────────────
  const blogWhere: Record<string, unknown> = { published: true }
  if (tag) blogWhere.tags = { has: tag }
  if (search) {
    blogWhere.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
    ]
  }
  if (isFollowingTab) blogWhere.authorId = { in: followingIds }

  const fetchUpTo = page * PAGE_SIZE
  const authorSelect = { id: true, name: true, username: true, image: true }
  const hotSince = new Date(Date.now() - HOT_WINDOW_MS)

  const [
    snippetsRaw, snippetCount,
    blogsRaw, blogCount,
    userStats,
    popularTagsRaw, popularBlogTagsRaw,
    trendingSnippets,
    suggestedUsers,
  ] = await Promise.all([
    type !== "blogs"
      ? prisma.snippet.findMany({
          where: snippetWhere,
          orderBy: snippetOrderBy,
          take: type === "all" ? fetchUpTo : PAGE_SIZE,
          skip: type === "all" ? 0 : (page - 1) * PAGE_SIZE,
          include: {
            author: { select: authorSelect },
            _count: { select: { likes: true, comments: true, bookmarks: true } },
          },
        })
      : Promise.resolve([]),
    type !== "blogs" ? prisma.snippet.count({ where: snippetWhere }) : Promise.resolve(0),
    type !== "snippets"
      ? prisma.blog.findMany({
          where: blogWhere,
          orderBy: blogOrderBy,
          take: type === "all" ? fetchUpTo : PAGE_SIZE,
          skip: type === "all" ? 0 : (page - 1) * PAGE_SIZE,
          include: {
            author: { select: authorSelect },
            _count: { select: { likes: true, comments: true } },
          },
        })
      : Promise.resolve([]),
    type !== "snippets" ? prisma.blog.count({ where: blogWhere }) : Promise.resolve(0),
    currentUserData
      ? prisma.user.findUnique({
          where: { id: currentUserData.id },
          select: {
            _count: { select: { snippets: true, collections: true, followers: true, likes: true } },
          },
        })
      : Promise.resolve(null),
    prisma.snippet.findMany({ where: { isPublic: true }, select: { tags: true }, take: 200 }),
    prisma.blog.findMany({ where: { published: true }, select: { tags: true }, take: 200 }),
    // Trending: most liked snippets from last 48h
    prisma.snippet.findMany({
      where: { isPublic: true, createdAt: { gte: hotSince } },
      orderBy: { likes: { _count: "desc" } },
      take: 5,
      select: {
        id: true, title: true, language: true,
        _count: { select: { likes: true } },
        author: { select: { name: true, username: true } },
      },
    }),
    // Suggested users to follow
    currentUserData
      ? prisma.user.findMany({
          where: {
            id: { not: currentUserData.id },
            followers: { none: { followerId: currentUserData.id } },
          },
          orderBy: { followers: { _count: "desc" } },
          take: 4,
          select: {
            id: true, name: true, username: true, image: true,
            _count: { select: { followers: true, snippets: { where: { isPublic: true } } } },
          },
        })
      : Promise.resolve([]),
  ])

  // ── Merge for "all" feed ─────────────────────────────────────────────
  type SnippetItem = (typeof snippetsRaw)[number] & { kind: "snippet" }
  type BlogItem = (typeof blogsRaw)[number] & { kind: "blog" }
  type FeedItem = SnippetItem | BlogItem

  let feedItems: FeedItem[] = []
  let totalCount = 0
  let totalPages = 0

  if (type === "snippets") {
    feedItems = snippetsRaw.map((s) => ({ ...s, kind: "snippet" as const }))
    totalCount = snippetCount
    totalPages = Math.ceil(totalCount / PAGE_SIZE)
  } else if (type === "blogs") {
    feedItems = blogsRaw.map((b) => ({ ...b, kind: "blog" as const }))
    totalCount = blogCount
    totalPages = Math.ceil(totalCount / PAGE_SIZE)
  } else {
    const tagged: FeedItem[] = [
      ...snippetsRaw.map((s) => ({ ...s, kind: "snippet" as const })),
      ...blogsRaw.map((b) => ({ ...b, kind: "blog" as const })),
    ]
    const getSortValue = (item: FeedItem): number => {
      if (sort === "popular") return item._count.likes
      if (sort === "viewed") return item.views
      if (sort === "discussed") return item._count.comments
      const d = item.kind === "blog"
        ? ((item as BlogItem).publishedAt ?? item.createdAt)
        : item.createdAt
      return new Date(d).getTime()
    }
    tagged.sort((a, b) => getSortValue(b) - getSortValue(a))
    totalCount = snippetCount + blogCount
    totalPages = Math.ceil(totalCount / PAGE_SIZE)
    const start = (page - 1) * PAGE_SIZE
    feedItems = tagged.slice(start, start + PAGE_SIZE)
  }

  // ── Popular tags ─────────────────────────────────────────────────────
  const tagFrequency: Record<string, number> = {}
  for (const s of popularTagsRaw) for (const t of s.tags) tagFrequency[t] = (tagFrequency[t] || 0) + 1
  for (const b of popularBlogTagsRaw) for (const t of b.tags) tagFrequency[t] = (tagFrequency[t] || 0) + 1
  const popularTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([t]) => t)

  // ── Hot snippet IDs (for badge) ───────────────────────────────────────
  const hotIds = new Set(
    trendingSnippets.filter((s) => s._count.likes >= HOT_THRESHOLD).map((s) => s.id)
  )

  // ── Sidebar stats ────────────────────────────────────────────────────
  const stats = userStats
    ? [
        { label: "Snippets", value: userStats._count.snippets, icon: Code2, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Collections", value: userStats._count.collections, icon: FolderOpen, color: "text-violet-500", bg: "bg-violet-500/10" },
        { label: "Followers", value: userStats._count.followers, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Likes Given", value: userStats._count.likes, icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
      ]
    : []

  const isEmpty = feedItems.length === 0

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="flex items-center gap-3 p-4 border-border/60">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Header + Controls */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Explore</h1>
            <p className="text-sm text-muted-foreground">
              Discover snippets and blog posts from the community
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/snippets/new">
              <Button size="sm" variant="outline">
                <Code2 className="mr-2 h-3.5 w-3.5" />Snippet
              </Button>
            </Link>
            <Link href="/blogs/new">
              <Button size="sm">
                <FileText className="mr-2 h-3.5 w-3.5" />Blog Post
              </Button>
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mb-4">
          {currentUserData && (
            <Suspense><FeedTabs activeTab={tab} /></Suspense>
          )}
          <Suspense><ContentTypeSelector activeType={type} /></Suspense>
        </div>
        <div className="mb-4">
          <Suspense><SortSelector activeSort={sort} /></Suspense>
        </div>
        <Suspense>
          <SearchFilter
            availableTags={popularTags}
            showLanguageFilter={type !== "blogs"}
            placeholder={
              type === "blogs" ? "Search blog posts by title or excerpt..."
              : type === "snippets" ? "Search snippets by title or description..."
              : "Search by title, description or excerpt..."
            }
          />
        </Suspense>
      </div>

      {/* 2-col layout: feed + sidebar */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_260px]">
        {/* Feed */}
        <div>
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <Code2 className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Nothing found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {isFollowingTab
                  ? followingIds.length === 0
                    ? "Follow some users to see their content here"
                    : "People you follow haven't posted anything yet"
                  : search || language || tag
                  ? "Try adjusting your search or filters"
                  : "Be the first to create something!"}
              </p>
              {!isFollowingTab && (
                <div className="flex gap-2">
                  <Link href="/snippets/new"><Button size="sm" variant="outline">New Snippet</Button></Link>
                  <Link href="/blogs/new"><Button size="sm" variant="outline">New Blog Post</Button></Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                {feedItems.map((item) => {
                  const isHot = item.kind === "snippet" && hotIds.has(item.id)
                  return (
                    <div key={`${item.kind}-${item.id}`} className="relative">
                      {isHot && (
                        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                          <Flame className="h-2.5 w-2.5" />
                          Hot
                        </div>
                      )}
                      {item.kind === "snippet" ? (
                        <SnippetCard snippet={item as SnippetItem} />
                      ) : (
                        <BlogCard blog={item as BlogItem} />
                      )}
                    </div>
                  )
                })}
              </div>
              <Suspense>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  pageSize={PAGE_SIZE}
                  itemLabel={type === "snippets" ? "snippets" : type === "blogs" ? "posts" : "items"}
                />
              </Suspense>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden xl:flex flex-col gap-5">
          {/* Trending now */}
          {trendingSnippets.length > 0 && (
            <Card className="p-4 border-border/60">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4 text-orange-500" />
                <p className="text-sm font-semibold">Trending Now</p>
                <span className="text-[10px] text-muted-foreground ml-auto">48h</span>
              </div>
              <div className="space-y-2">
                {trendingSnippets.map((s, i) => (
                  <Link key={s.id} href={`/snippets/${s.id}`}>
                    <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted transition-colors group">
                      <span className="text-xs font-bold text-muted-foreground/50 w-4 shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors">
                          {s.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">{s.language}</p>
                      </div>
                      <span className="flex items-center gap-0.5 text-[10px] text-rose-500 shrink-0">
                        <Heart className="h-2.5 w-2.5" />
                        {s._count.likes}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Popular tags */}
          {popularTags.length > 0 && (
            <Card className="p-4 border-border/60">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Popular Tags</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularTags.slice(0, 12).map((t) => (
                  <Link key={t} href={`/tags/${encodeURIComponent(t)}`}>
                    <Badge
                      variant={tag === t ? "default" : "outline"}
                      className="cursor-pointer text-[11px] hover:bg-muted transition-colors"
                    >
                      #{t}
                    </Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Suggested users */}
          {(suggestedUsers as unknown[]).length > 0 && (
            <Card className="p-4 border-border/60">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <p className="text-sm font-semibold">Who to Follow</p>
              </div>
              <div className="space-y-3">
                {(suggestedUsers as Array<{
                  id: string; name: string | null; username: string | null; image: string | null;
                  _count: { followers: number; snippets: number }
                }>).map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username ?? user.id}`}
                    className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback className="text-xs">
                        {user.name?.charAt(0) || user.username?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{user.name || user.username}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {user._count.followers} followers · {user._count.snippets} snippets
                      </p>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Explore collections link */}
          <Link href="/collections/explore">
            <Card className="p-4 border-border/60 hover:border-border hover:shadow-sm transition-all group cursor-pointer">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-violet-500" />
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                  Explore Collections
                </p>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Browse curated snippet collections
              </p>
            </Card>
          </Link>
        </aside>
      </div>
    </div>
  )
}
