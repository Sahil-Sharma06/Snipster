import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FollowButton } from "@/components/features/follow-button"
import { Pagination } from "@/components/shared/pagination"
import { Code2, Users, Search } from "lucide-react"
import Link from "next/link"

const PAGE_SIZE = 18

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const q = typeof params.q === "string" ? params.q.trim() : ""
  const pageParam = typeof params.page === "string" ? parseInt(params.page, 10) : 1
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
  const skip = (page - 1) * PAGE_SIZE

  const currentUser = await getCurrentUser()

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { username: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Discover People</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find developers to follow and explore their work
        </p>
      </div>

      {/* Search form */}
      <form method="GET" action="/search" className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or username..."
            autoComplete="off"
            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <Button type="submit" size="sm">
          Search
        </Button>
        {q && (
          <Link href="/search">
            <Button type="button" variant="ghost" size="sm">
              Clear
            </Button>
          </Link>
        )}
      </form>

      {/* Result count */}
      {q && (
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? `No users found for "${q}"`
            : `${total} result${total === 1 ? "" : "s"} for "${q}"`}
        </p>
      )}

      {/* User grid */}
      {users.length === 0 && !q ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Users className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : users.length === 0 ? null : (
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
                        {user.name?.charAt(0) ??
                          user.username?.charAt(0) ??
                          "?"}
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
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {user.bio}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                  <span className="flex items-center gap-1">
                    <Code2 className="h-3 w-3" />
                    {user._count.snippets}{" "}
                    {user._count.snippets === 1 ? "snippet" : "snippets"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {user._count.followers}{" "}
                    {user._count.followers === 1 ? "follower" : "followers"}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={PAGE_SIZE}
          basePath="/search"
          itemLabel="users"
        />
      )}
    </div>
  )
}
