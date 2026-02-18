import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { SnippetCard } from "@/components/shared/snippet-card"
import { SearchFilter } from "@/components/features/search-filter"
import { Card } from "@/components/ui/card"
import { Code2, Heart, Users, FolderOpen } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"

interface FeedPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams
  const search = typeof params.search === "string" ? params.search : ""
  const language = typeof params.language === "string" ? params.language : ""

  const currentUserData = await getCurrentUser()

  const where: Record<string, unknown> = { isPublic: true }

  if (language) {
    where.language = language
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  const [snippets, userStats] = await Promise.all([
    prisma.snippet.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
            bookmarks: true,
          },
        },
      },
    }),
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
  ])

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
        <Suspense>
          <SearchFilter />
        </Suspense>
      </div>

      {/* Snippet Grid */}
      {snippets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Code2 className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No snippets found</p>
          <p className="text-sm text-muted-foreground mb-4">
            {search || language
              ? "Try adjusting your search or filters"
              : "Be the first to create one!"}
          </p>
          <Link href="/snippets/new">
            <Button size="sm" variant="outline">
              Create a snippet
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snippets.map((snippet) => (
            <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
        </div>
      )}
    </div>
  )
}
