import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { SnippetCard } from "@/components/shared/snippet-card"
import { SearchFilter } from "@/components/features/search-filter"
import { Pagination } from "@/components/shared/pagination"
import { Card } from "@/components/ui/card"
import { Code2, Heart, Users, FolderOpen } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"
import { FeedTabs } from "@/components/features/feed-tabs"

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
  const pageParam =
    typeof params.page === "string" ? parseInt(params.page, 10) : 1
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam

  const currentUserData = await getCurrentUser()
  const isFollowingTab = tab === "following" && !!currentUserData

  // Build base where clause
  const baseWhere: Record<string, unknown> = { isPublic: true }

  if (language) baseWhere.language = language
  if (tag) baseWhere.tags = { has: tag }
  if (search) {
    baseWhere.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  // For the following tab, narrow snippets to users the current user follows
  let followingIds: string[] = []
  if (isFollowingTab) {
    const follows = await prisma.follow.findMany({
      where: { followerId: currentUserData!.id },
      select: { followingId: true },
    })
    followingIds = follows.map((f) => f.followingId)
    baseWhere.authorId = { in: followingIds }
  }

  const where = baseWhere

  const [snippets, totalCount, userStats, popularTagsRaw] = await Promise.all([
    prisma.snippet.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
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
            bookmarks: true,
          },
        },
      },
    }),
    prisma.snippet.count({ where }),
    currentUserData
      ? prisma.user.findUnique({
          where: { id: currentUserData.id },
          select: {
            _count: {
              select: {
                snippets: true,
                collections: true,
                followers: true,
                likes: true,
              },
            },
          },
        })
      : null,
    // Collect tags from recent public snippets to populate the tag filter
    prisma.snippet.findMany({
      where: { isPublic: true },
      select: { tags: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ])

  // Build a frequency-sorted list of popular tags
  const tagFrequency: Record<string, number> = {}
  for (const s of popularTagsRaw) {
    for (const t of s.tags) {
      tagFrequency[t] = (tagFrequency[t] || 0) + 1
    }
  }
  const popularTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([t]) => t)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const stats = userStats
    ? [
        {
          label: "Snippets",
          value: userStats._count.snippets,
          icon: Code2,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
        },
        {
          label: "Collections",
          value: userStats._count.collections,
          icon: FolderOpen,
          color: "text-violet-500",
          bg: "bg-violet-500/10",
        },
        {
          label: "Followers",
          value: userStats._count.followers,
          icon: Users,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
        },
        {
          label: "Likes Given",
          value: userStats._count.likes,
          icon: Heart,
          color: "text-rose-500",
          bg: "bg-rose-500/10",
        },
      ]
    : []

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="flex items-center gap-3 p-4 border-border/60"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Search & Filter */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Explore Snippets</h1>
            <p className="text-sm text-muted-foreground">
              Discover code snippets from the community
            </p>
          </div>
          <Link href="/snippets/new" className="hidden sm:block">
            <Button size="sm">New Snippet</Button>
          </Link>
        </div>

        {/* Feed Tabs */}
        {currentUserData && (
          <div className="mb-4">
            <Suspense>
              <FeedTabs activeTab={tab} />
            </Suspense>
          </div>
        )}

        <Suspense>
          <SearchFilter availableTags={popularTags} />
        </Suspense>
      </div>

      {/* Snippet Grid */}
      {snippets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Code2 className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No snippets found</p>
          <p className="text-sm text-muted-foreground mb-4">
            {isFollowingTab
              ? followingIds.length === 0
                ? "Follow some users to see their snippets here"
                : "People you follow haven't posted any public snippets yet"
              : search || language || tag
              ? "Try adjusting your search or filters"
              : "Be the first to create one!"}
          </p>
          {!isFollowingTab && (
            <Link href="/snippets/new">
              <Button size="sm" variant="outline">
                Create a snippet
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {snippets.map((snippet) => (
              <SnippetCard key={snippet.id} snippet={snippet} />
            ))}
          </div>

          <Suspense>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={PAGE_SIZE}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}
