import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SnippetCard } from "@/components/shared/snippet-card"
import { CollectionActions } from "@/components/features/collection-actions"
import { AddSnippetsDialog } from "@/components/features/add-snippets-dialog"
import { RemoveSnippetButton } from "@/components/features/remove-snippet-button"
import { FolderOpen, Globe, Lock, Code2, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface CollectionPageProps {
  params: Promise<{ id: string }>
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params
  const currentUser = await getCurrentUser()

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true, clerkId: true },
      },
      snippets: {
        orderBy: { addedAt: "desc" },
        include: {
          snippet: {
            include: {
              author: {
                select: { id: true, name: true, username: true, image: true },
              },
              _count: {
                select: { likes: true, comments: true, bookmarks: true },
              },
            },
          },
        },
      },
      _count: { select: { snippets: true } },
    },
  })

  if (!collection) notFound()

  // Private collections only visible to owner
  if (!collection.isPublic && collection.user.id !== currentUser?.id) {
    notFound()
  }

  const isOwner = currentUser?.id === collection.user.id
  const existingSnippetIds = collection.snippets.map((cs) => cs.snippetId)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
            <FolderOpen className="h-6 w-6 text-violet-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{collection.name}</h1>
              {collection.isPublic ? (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Globe className="h-3 w-3" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Lock className="h-3 w-3" />
                  Private
                </Badge>
              )}
            </div>
            {collection.description && (
              <p className="mt-1 text-muted-foreground text-sm max-w-xl">
                {collection.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Code2 className="h-3.5 w-3.5" />
                {collection._count.snippets}{" "}
                {collection._count.snippets === 1 ? "snippet" : "snippets"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Updated{" "}
                {formatDistanceToNow(new Date(collection.updatedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex items-center gap-2 shrink-0">
            <AddSnippetsDialog
              collectionId={collection.id}
              existingSnippetIds={existingSnippetIds}
            />
            <CollectionActions collectionId={collection.id} isOwner={isOwner} />
          </div>
        )}
      </div>

      <Separator />

      {/* Snippets grid */}
      {collection.snippets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Code2 className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-1">No snippets in this collection yet</p>
          {isOwner && (
            <p className="text-sm text-muted-foreground">
              Use &ldquo;Add Snippets&rdquo; above to add your first one.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collection.snippets.map(({ snippet, snippetId }) => (
            <div key={snippetId} className="relative group/card">
              <SnippetCard snippet={snippet} />
              {isOwner && (
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <RemoveSnippetButton
                    collectionId={collection.id}
                    snippetId={snippetId}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
