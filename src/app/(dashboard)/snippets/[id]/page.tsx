import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

interface SnippetPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SnippetPage({ params }: SnippetPageProps) {
  const { id } = await params
  
  // Fetch snippet from database
  const snippet = await prisma.snippet.findUnique({
    where: { id },
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

  // If snippet doesn't exist, show 404
  if (!snippet) {
    notFound()
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">{snippet.title}</h1>
        
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            <AvatarImage src={snippet.author.image || ""} />
            <AvatarFallback>
              {snippet.author.name?.charAt(0) || snippet.author.username?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {snippet.author.name || snippet.author.username}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(snippet.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Tags and Language */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline">{snippet.language}</Badge>
          {snippet.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Description */}
        {snippet.description && (
          <p className="text-muted-foreground mb-4">{snippet.description}</p>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>❤️ {snippet._count.likes} likes</span>
          <span>💬 {snippet._count.comments} comments</span>
          <span>🔖 {snippet._count.bookmarks} bookmarks</span>
        </div>
      </div>

      {/* Code Block */}
      <Card className="p-4">
        <pre className="overflow-x-auto">
          <code className="text-sm font-mono">{snippet.code}</code>
        </pre>
      </Card>
    </div>
  )
}
