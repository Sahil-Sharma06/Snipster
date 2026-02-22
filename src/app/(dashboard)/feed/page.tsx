import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { SnippetCard } from "@/components/shared/snippet-card"
import { BlogCard } from "@/components/shared/blog-card"
import { SearchFilter } from "@/components/features/search-filter"
import { Pagination } from "@/components/shared/pagination"
import { Card } from "@/components/ui/card"
import { Code2, Heart, Users, FolderOpen, FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"
import { FeedTabs } from "@/components/features/feed-tabs"
import { SortSelector, type SortOption } from "@/components/features/sort-selector"
import { ContentTypeSelector, type ContentType } from "@/components/features/content-type-selector"

const PAGE_SIZE = 18

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
  const pageParam =
    typeof params.page === "string" ? parseInt(params.page, 10) : 1
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam

  const currentUserData = await getCurrentUser()
  const isFollowingTab = tab === "following" && !!currentUserData

  // â”€â”€ shared ordering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const snippetOrderBy =
    sort === "popular"
      ? { likes: { _count: "desc" as const } }
      : sort === "viewed"
      ? { views: "desc" as const }
      : sort === "discussed"
      ? { comments: { _count: "desc" as const } }
      : { createdAt: "desc" as const }

  const blogOrderBy =
    sort === "popular"
      ? { likes: { _count: "desc" as const } }
      : sort === "viewed"
      ? { views: "desc" as const }
      : sort === "discussed"
      ? { comments: { _count: "desc" as const } }
      : { publishedAt: "desc" as const }

  // â”€â”€ following filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let followingIds: string[] = []
  if (isFollowingTab) {
    const follows = await prisma.follow.findMany({
      where: { followerId: currentUserData!.id },
      select: { followingId: true },
    })
    followingIds = follows.map((f) => f.followingId)
  }

  // â”€â”€ snippet where â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ blog where â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const blogWhere: Record<string, unknown> = { published: true }
  if (tag) blogWhere.tags = { has: tag }
  if (search) {
    blogWhere.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
    ]
  }
  if (isFollowingTab) blogWhere.authorId = { in: followingIds }

  // â”€â”€ For the unified "all" feed we over-fetch up to the current page
  //    boundary from both collections, merge+sort, then slice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchUpTo = page * PAGE_SIZE

  const authorSelect = { id: true, name: true, username: true, image: true }

  const [
    snippetsRaw,
    snippetCount,
    blogsRaw,
    blogCount,
    userStats,
    popularTagsRaw,
    popularBlogTagsRaw,
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
    type !== "blogs"
      ? prisma.snippet.count({ where: snippetWhere })
      : Promise.resolve(0),
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
    type !== "snippets"
      ? prisma.blog.count({ where: blogWhere })
      : Promise.resolve(0),
    currentUserData
      ? prisma.user.findUnique({
          where: { id: currentUserData.id },
          select: {
            _count: {
              select: { snippets: true, collections: true, followers: true, likes: true },
            },
          },
        })
      : Promise.resolve(null),
    prisma.snippet.findMany({
      where: { isPublic: true },
      select: { tags: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.blog.findMany({
      where: { published: true },
      select: { tags: true },
      orderBy: { publishedAt: "desc" },
      take: 200,
    }),
  ])

  // â”€â”€ Merge for "all" feed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    // Merge: tag each item then sort
    const tagged: FeedItem[] = [
      ...snippetsRaw.map((s) => ({ ...s, kind: "snippet" as const })),
      ...blogsRaw.map((b) => ({ ...b, kind: "blog" as const })),
    ]

    const getSortValue = (item: FeedItem): number => {
      if (sort === "popular") return item._count.likes
      if (sort === "viewed") return item.views
      if (sort === "discussed") return item._count.comments
      // latest â€” compare by date
      const d =
        item.kind === "blog"
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

  // â”€â”€ Popular tags â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tagFrequency: Record<string, number> = {}
  for (const s of popularTagsRaw) {
    for (const t of s.tags) tagFrequency[t] = (tagFrequency[t] || 0) + 1
  }
  for (const b of popularBlogTagsRaw) {
    for (const t of b.tags) tagFrequency[t] = (tagFrequency[t] || 0) + 1
  }
  const popularTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([t]) => t)

  // â”€â”€ Sidebar stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
                <Code2 className="mr-2 h-3.5 w-3.5" />
                Snippet
              </Button>
            </Link>
            <Link href="/blogs/new">
              <Button size="sm">
                <FileText className="mr-2 h-3.5 w-3.5" />
                Blog Post
              </Button>
            </Link>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Everyone / Following */}
          {currentUserData && (
            <Suspense>
              <FeedTabs activeTab={tab} />
            </Suspense>
          )}
          {/* All / Snippets / Blogs */}
          <Suspense>
            <ContentTypeSelector activeType={type} />
          </Suspense>
        </div>

        {/* Sort selector */}
        <div className="mb-4">
          <Suspense>
            <SortSelector activeSort={sort} />
          </Suspense>
        </div>

        {/* Search + tag filter */}
        <Suspense>
          <SearchFilter
            availableTags={popularTags}
            showLanguageFilter={type !== "blogs"}
            placeholder={
              type === "blogs"
                ? "Search blog posts by title or excerpt..."
                : type === "snippets"
                ? "Search snippets by title or description..."
                : "Search by title, description or excerpt..."
            }
          />
        </Suspense>
      </div>

      {/* Feed */}
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
              <Link href="/snippets/new">
                <Button size="sm" variant="outline">New Snippet</Button>
              </Link>
              <Link href="/blogs/new">
                <Button size="sm" variant="outline">New Blog Post</Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {feedItems.map((item) =>
              item.kind === "snippet" ? (
                <SnippetCard key={`s-${item.id}`} snippet={item as SnippetItem} />
              ) : (
                <BlogCard key={`b-${item.id}`} blog={item as BlogItem} />
              )
            )}
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
  )
}
