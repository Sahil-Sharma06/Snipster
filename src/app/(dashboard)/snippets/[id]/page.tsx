import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { CodeBlock } from "@/components/shared/code-block"
import { SnippetActions } from "@/components/features/snippet-actions"
import { getCurrentUser } from "@/lib/auth/current-user"

interface SnippetPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SnippetPage({ params }: SnippetPageProps) {
  const { id } = await params
  const currentUserData = await getCurrentUser()
  
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

  if (!snippet) {
    notFound()
  }

  const isAuthor = currentUserData?.id === snippet.authorId

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold flex-1">{snippet.title}</h1>
          <SnippetActions snippetId={snippet.id} isAuthor={isAuthor} />
        </div>
        
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

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline">{snippet.language}</Badge>
          {snippet.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        {snippet.description && (
          <p className="text-muted-foreground mb-4">{snippet.description}</p>
        )}

        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>❤️ {snippet._count.likes} likes</span>
          <span>💬 {snippet._count.comments} comments</span>
          <span>🔖 {snippet._count.bookmarks} bookmarks</span>
        </div>
      </div>

      <CodeBlock code={snippet.code} language={snippet.language} />
    </div>
  )
}
