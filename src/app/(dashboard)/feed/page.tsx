import { prisma } from "@/lib/db/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export default async function FeedPage() {
  const snippets = await prisma.snippet.findMany({
    where: {
      isPublic: true,
    },
    orderBy: {
      createdAt: "desc",
    },
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
  })

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Snippet Feed</h1>
        <p className="text-muted-foreground">
          Browse and discover code snippets from the community
        </p>
      </div>

      {snippets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            No snippets found. Be the first to create one!
          </p>
          <Link
            href="/snippets/new"
            className="text-primary hover:underline font-medium"
          >
            Create a snippet →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {snippets.map((snippet) => (
            <Link key={snippet.id} href={`/snippets/${snippet.id}`}>
              <Card className="p-6 h-full hover:shadow-lg transition-shadow cursor-pointer">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={snippet.author.image || ""} />
                    <AvatarFallback>
                      {snippet.author.name?.charAt(0) ||
                        snippet.author.username?.charAt(0) ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {snippet.author.name || snippet.author.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(snippet.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {snippet.title}
                </h3>

                {/* Description */}
                {snippet.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {snippet.description}
                  </p>
                )}

                {/* Code Preview */}
                <div className="bg-muted rounded-md p-3 mb-4 overflow-hidden">
                  <pre className="text-xs font-mono line-clamp-3">
                    <code>{snippet.code}</code>
                  </pre>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    {snippet.language}
                  </Badge>
                  {snippet.tags.slice(0, 2).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {snippet.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{snippet.tags.length - 2}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>❤️ {snippet._count.likes}</span>
                  <span>💬 {snippet._count.comments}</span>
                  <span>🔖 {snippet._count.bookmarks}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
