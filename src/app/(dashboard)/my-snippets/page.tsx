import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import { SnippetCard } from "@/components/shared/snippet-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/shared/pagination"
import { Code2, Plus, Lock, Globe } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Suspense } from "react"

const PAGE_SIZE = 12

interface MySnippetsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function MySnippetsPage({ searchParams }: MySnippetsPageProps) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const params = await searchParams
  const pageParam = typeof params.page === "string" ? parseInt(params.page, 10) : 1
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam

  const [snippets, totalItems, publicCount, privateCount] = await Promise.all([
    prisma.snippet.findMany({
      where: { authorId: user.id },
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
    prisma.snippet.count({ where: { authorId: user.id } }),
    prisma.snippet.count({ where: { authorId: user.id, isPublic: true } }),
    prisma.snippet.count({ where: { authorId: user.id, isPublic: false } }),
  ])

  const totalPages = Math.ceil(totalItems / PAGE_SIZE)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Snippets</h1>
          <p className="text-sm text-muted-foreground">
            Manage all your code snippets
          </p>
        </div>
        <Link href="/snippets/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Snippet
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Code2 className="h-4 w-4" />
          {totalItems} total
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          {publicCount} public
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          {privateCount} private
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Code2 className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            You haven&apos;t created any snippets yet
          </p>
          <Link href="/snippets/new">
            <Button size="sm" variant="outline">
              Create your first snippet
            </Button>
          </Link>
        </div>
      ) : (
        <>
        <div className="space-y-3">
          {snippets.map((snippet) => (
            <Link key={snippet.id} href={`/snippets/${snippet.id}`}>
              <Card className="p-4 hover:shadow-md transition-all hover:border-border cursor-pointer border-border/60">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">
                        {snippet.title}
                      </h3>
                      {!snippet.isPublic && (
                        <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    {snippet.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {snippet.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-xs capitalize"
                      >
                        {snippet.language}
                      </Badge>
                      {snippet.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(snippet.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground shrink-0">
                    <span>{snippet._count.likes} likes</span>
                    <span>{snippet._count.comments} comments</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        <Suspense fallback={null}>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            basePath="/my-snippets"
            itemLabel="snippets"
          />
        </Suspense>
        </>
      )}
    </div>
  )
}
