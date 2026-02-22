import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { SnippetCard } from "@/components/shared/snippet-card"
import { SearchFilter } from "@/components/features/search-filter"
import { SortSelector, type SortOption } from "@/components/features/sort-selector"
import { Pagination } from "@/components/shared/pagination"
import { Button } from "@/components/ui/button"
import { Code2, Plus } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

const PAGE_SIZE = 18

interface SnippetsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SnippetsPage({ searchParams }: SnippetsPageProps) {
  const params = await searchParams
  const search = typeof params.search === "string" ? params.search : ""
  const language = typeof params.language === "string" ? params.language : ""
  const tag = typeof params.tag === "string" ? params.tag : ""
  const rawSort = typeof params.sort === "string" ? params.sort : "latest"
  const sort: SortOption = ["latest", "popular", "viewed", "discussed"].includes(rawSort)
    ? (rawSort as SortOption)
    : "latest"
  const pageParam =
    typeof params.page === "string" ? parseInt(params.page, 10) : 1
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam

  const currentUser = await getCurrentUser()

  const orderBy =
    sort === "popular"
      ? { likes: { _count: "desc" as const } }
      : sort === "viewed"
      ? { views: "desc" as const }
      : sort === "discussed"
      ? { comments: { _count: "desc" as const } }
      : { createdAt: "desc" as const }

  const where: Record<string, unknown> = { isPublic: true }
  if (language) where.language = language
  if (tag) where.tags = { has: tag }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  const [snippets, totalItems] = await Promise.all([
    prisma.snippet.findMany({
      where,
      orderBy,
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
  ])

  const totalPages = Math.ceil(totalItems / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Browse Snippets</h1>
          <p className="text-sm text-muted-foreground">
            Explore public code snippets from the community
          </p>
        </div>
        {currentUser && (
          <Link href="/snippets/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Snippet
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchFilter basePath="/snippets" />
          <SortSelector activeSort={sort} basePath="/snippets" />
        </div>
      </Suspense>

      {/* Results */}
      {snippets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Code2 className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No snippets found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {snippets.map((snippet) => (
              <SnippetCard key={snippet.id} snippet={snippet} />
            ))}
          </div>

          <Suspense fallback={null}>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              basePath="/snippets"
              itemLabel="snippets"
            />
          </Suspense>
        </>
      )}
    </div>
  )
}
