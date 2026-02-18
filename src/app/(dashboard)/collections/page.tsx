import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FolderOpen, Plus, Code2, Lock, Globe } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default async function CollectionsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          snippets: true,
        },
      },
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Collections</h1>
          <p className="text-sm text-muted-foreground">
            Organize your snippets into collections
          </p>
        </div>
        <Link href="/collections/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FolderOpen className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            You don&apos;t have any collections yet
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Collections help you organize your snippets by topic or project
          </p>
          <Link href="/collections/new">
            <Button size="sm" variant="outline">
              Create your first collection
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card
              key={collection.id}
              className="group p-5 border-border/60 hover:border-border hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                  <FolderOpen className="h-5 w-5 text-violet-500" />
                </div>
                {collection.isPublic ? (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                {collection.name}
              </h3>
              {collection.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {collection.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Code2 className="h-3 w-3" />
                  {collection._count.snippets} snippets
                </span>
                <span>
                  {formatDistanceToNow(new Date(collection.updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
