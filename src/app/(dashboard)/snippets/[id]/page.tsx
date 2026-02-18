import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"
import { CodeBlock } from "@/components/shared/code-block"
import { SnippetActions } from "@/components/features/snippet-actions"
import { LikeButton } from "@/components/features/like-button"
import { BookmarkButton } from "@/components/features/bookmark-button"
import { CommentSection } from "@/components/features/comment-section"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Eye, Calendar } from "lucide-react"

interface SnippetPageProps {
  params: Promise<{ id: string }>
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

  let hasLiked = false
  let hasBookmarked = false

  if (currentUserData) {
    const [like, bookmark] = await Promise.all([
      prisma.like.findUnique({
        where: {
          userId_snippetId: {
            userId: currentUserData.id,
            snippetId: snippet.id,
          },
        },
      }),
      prisma.bookmark.findUnique({
        where: {
          userId_snippetId: {
            userId: currentUserData.id,
            snippetId: snippet.id,
          },
        },
      }),
    ])
    hasLiked = !!like
    hasBookmarked = !!bookmark
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold sm:text-3xl">{snippet.title}</h1>
          <SnippetActions snippetId={snippet.id} isAuthor={isAuthor} />
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={snippet.author.image || ""} />
            <AvatarFallback>
              {snippet.author.name?.charAt(0) ||
                snippet.author.username?.charAt(0) ||
                "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">
              {snippet.author.name || snippet.author.username}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(snippet.createdAt), {
                addSuffix: true,
              })}
              {snippet.isPublic ? (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Public
                </span>
              ) : (
                <span>Private</span>
              )}
            </div>
          </div>
        </div>

        {snippet.description && (
          <p className="text-muted-foreground">{snippet.description}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="capitalize">
            {snippet.language}
          </Badge>
          {snippet.tags.map((tag: string) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Social Actions */}
        <div className="flex items-center gap-1">
          <LikeButton
            snippetId={snippet.id}
            initialLiked={hasLiked}
            initialCount={snippet._count.likes}
          />
          <BookmarkButton
            snippetId={snippet.id}
            initialBookmarked={hasBookmarked}
            initialCount={snippet._count.bookmarks}
          />
        </div>
      </div>

      {/* Code Block */}
      <CodeBlock code={snippet.code} language={snippet.language} />

      {/* Comments */}
      <Separator />
      <CommentSection
        snippetId={snippet.id}
        currentUserId={currentUserData?.id || null}
        initialCount={snippet._count.comments}
      />
    </div>
  )
}
