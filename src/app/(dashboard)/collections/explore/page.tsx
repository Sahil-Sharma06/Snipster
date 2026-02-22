import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { FolderOpen, Code2, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default async function ExploreCollectionsPage() {
  const currentUser = await getCurrentUser()

  const collections = await prisma.collection.findMany({
    where: { isPublic: true },
    orderBy: { updatedAt: "desc" },
    take: 60,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      _count: {
        select: { snippets: true },
      },
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Explore Collections</h1>
          <p className="text-sm text-muted-foreground">
            Browse public snippet collections from the community
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/collections">
            <Button variant="outline" size="sm">
              My Collections
            </Button>
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

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FolderOpen className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No public collections yet</p>
          <p className="text-sm text-muted-foreground">
            Be the first to make a collection public!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.id}`}>
              <Card className="group h-full p-5 border-border/60 hover:border-border hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                    <FolderOpen className="h-5 w-5 text-violet-500" />
                  </div>
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {collection.description}
                  </p>
                )}

                {/* Author */}
                <div className="flex items-center gap-1.5 mb-3">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={collection.user.image || ""} />
                    <AvatarFallback className="text-xs">
                      {collection.user.name?.charAt(0) ||
                        collection.user.username?.charAt(0) ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {collection.user.name || collection.user.username}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t border-border/40">
                  <span className="flex items-center gap-1">
                    <Code2 className="h-3 w-3" />
                    {collection._count.snippets} snippet
                    {collection._count.snippets !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                    {formatDistanceToNow(new Date(collection.updatedAt), {
                      addSuffix: true,
                    })}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
