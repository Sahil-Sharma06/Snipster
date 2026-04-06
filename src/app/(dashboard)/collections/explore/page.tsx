import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { FolderOpen, Code2, ArrowRight, Plus, Hash, TrendingUp, Search } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default async function ExploreCollectionsPage() {
  const currentUser = await getCurrentUser()

  const [collections, popularTagsRaw, topCreators] = await Promise.all([
    prisma.collection.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: "desc" },
      take: 60,
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        _count: { select: { snippets: true } },
        snippets: {
          take: 3,
          include: {
            snippet: { select: { language: true } },
          },
        },
      },
    }),
    // Collect all tags from snippets in public collections
    prisma.snippet.findMany({
      where: { isPublic: true },
      select: { tags: true },
      take: 300,
    }),
    // Most prolific collection creators
    prisma.user.findMany({
      where: { collections: { some: { isPublic: true } } },
      orderBy: { collections: { _count: "desc" } },
      take: 5,
      select: {
        id: true, name: true, username: true, image: true,
        _count: { select: { collections: { where: { isPublic: true } } } },
      },
    }),
  ])

  // Build tag frequency
  const tagFreq: Record<string, number> = {}
  for (const s of popularTagsRaw) {
    for (const t of s.tags) tagFreq[t] = (tagFreq[t] || 0) + 1
  }
  const popularTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([t]) => t)

  // Get unique languages from each collection's snippets
  function getCollectionLanguages(col: typeof collections[number]) {
    const langs = new Set<string>()
    for (const cs of col.snippets) {
      if (cs.snippet?.language) langs.add(cs.snippet.language)
    }
    return Array.from(langs).slice(0, 3)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Explore Collections</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse {collections.length} public collections from the community
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/collections">
            <Button variant="outline" size="sm">My Collections</Button>
          </Link>
          {currentUser && (
            <Link href="/collections/new">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Collection
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_240px]">
        {/* Main grid */}
        <div>
          {collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
              <FolderOpen className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No public collections yet</p>
              <p className="text-sm text-muted-foreground mb-4">Be the first to make a collection public!</p>
              {currentUser && (
                <Link href="/collections/new">
                  <Button size="sm" variant="outline">Create a collection</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {collections.map((collection) => {
                const langs = getCollectionLanguages(collection)
                return (
                  <Link key={collection.id} href={`/collections/${collection.id}`}>
                    <Card className="card-shimmer group h-full p-5 border-border/60 hover:border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                      {/* Top row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 group-hover:scale-110 transition-transform duration-200">
                          <FolderOpen className="h-5 w-5 text-violet-500" />
                        </div>
                        {langs.length > 0 && (
                          <div className="flex gap-1">
                            {langs.map((lang) => (
                              <span
                                key={lang}
                                className="text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                          {collection.description}
                        </p>
                      )}

                      {/* Author */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={collection.user.image || ""} />
                          <AvatarFallback className="text-[9px]">
                            {collection.user.name?.charAt(0) || collection.user.username?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {collection.user.name || collection.user.username}
                        </span>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-2">
                        <span className="flex items-center gap-1">
                          <Code2 className="h-3 w-3" />
                          {collection._count.snippets} snippet{collection._count.snippets !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                          {formatDistanceToNow(new Date(collection.updatedAt), { addSuffix: true })}
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Popular tags */}
          {popularTags.length > 0 && (
            <Card className="p-4 border-border/60">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="h-4 w-4 text-violet-500" />
                <p className="text-sm font-semibold">Popular Tags</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularTags.map((tag) => (
                  <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer text-[11px] hover:bg-muted transition-colors"
                    >
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Top collectors */}
          {topCreators.length > 0 && (
            <Card className="p-4 border-border/60">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-violet-500" />
                <p className="text-sm font-semibold">Top Collectors</p>
              </div>
              <div className="space-y-3">
                {topCreators.map((creator) => (
                  <Link
                    key={creator.id}
                    href={`/profile/${creator.username ?? creator.id}?tab=collections`}
                    className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={creator.image || ""} />
                      <AvatarFallback className="text-xs">
                        {creator.name?.charAt(0) || creator.username?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {creator.name || creator.username}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {creator._count.collections} collection{creator._count.collections !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* CTA */}
          <Card className="p-4 border-border/60 bg-gradient-to-br from-violet-500/5 to-transparent">
            <FolderOpen className="h-6 w-6 text-violet-500 mb-2" />
            <p className="text-sm font-semibold mb-1">Organize your snippets</p>
            <p className="text-xs text-muted-foreground mb-3">
              Group your code into themed collections and share with the community.
            </p>
            {currentUser ? (
              <Link href="/collections/new">
                <Button size="sm" className="w-full" variant="outline">
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Create Collection
                </Button>
              </Link>
            ) : (
              <Link href="/sign-in">
                <Button size="sm" className="w-full" variant="outline">
                  Sign in to create
                </Button>
              </Link>
            )}
          </Card>
        </aside>
      </div>
    </div>
  )
}
