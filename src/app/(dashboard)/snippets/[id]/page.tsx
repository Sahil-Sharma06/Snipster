import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"
import { CodeBlock } from "@/components/shared/code-block"
import { SnippetCard } from "@/components/shared/snippet-card"
import { SnippetActions } from "@/components/features/snippet-actions"
import { LikeButton } from "@/components/features/like-button"
import { BookmarkButton } from "@/components/features/bookmark-button"
import { ForkButton } from "@/components/features/fork-button"
import { FollowButton } from "@/components/features/follow-button"
import { CommentSection } from "@/components/features/comment-section"
import { ViewTracker } from "@/components/shared/view-tracker"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Eye, Calendar, Code2, Users, Share2 } from "lucide-react"
import Link from "next/link"

interface SnippetPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: SnippetPageProps) {
  const { id } = await params
  const snippet = await prisma.snippet.findUnique({
    where: { id },
    select: { title: true, description: true, language: true, author: { select: { name: true, username: true } } },
  })
  if (!snippet) return { title: "Snippet not found" }
  const author = snippet.author.name || snippet.author.username || "Unknown"
  return {
    title: `${snippet.title} — ${snippet.language} snippet by ${author} | Snipster`,
    description: snippet.description || `A ${snippet.language} code snippet by ${author} on Snipster`,
    openGraph: {
      title: snippet.title,
      description: snippet.description || `A ${snippet.language} snippet by ${author}`,
    },
  }
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
          bio: true,
          _count: {
            select: {
              snippets: { where: { isPublic: true } },
              followers: true,
            },
          },
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

  if (!snippet) notFound()

  const isAuthor = currentUserData?.id === snippet.authorId

  // Parallel: check like/bookmark state + fetch related snippets + author's other snippets
  const [like, bookmark, relatedSnippets, moreFromAuthor, isFollowing] = await Promise.all([
    currentUserData
      ? prisma.like.findUnique({
          where: { userId_snippetId: { userId: currentUserData.id, snippetId: snippet.id } },
        })
      : null,
    currentUserData
      ? prisma.bookmark.findUnique({
          where: { userId_snippetId: { userId: currentUserData.id, snippetId: snippet.id } },
        })
      : null,
    // Related: same language, not this snippet
    prisma.snippet.findMany({
      where: {
        isPublic: true,
        language: snippet.language,
        id: { not: snippet.id },
      },
      orderBy: { likes: { _count: "desc" } },
      take: 3,
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
        _count: { select: { likes: true, comments: true, bookmarks: true } },
      },
    }),
    // More from author
    prisma.snippet.findMany({
      where: {
        isPublic: true,
        authorId: snippet.authorId,
        id: { not: snippet.id },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
        _count: { select: { likes: true, comments: true, bookmarks: true } },
      },
    }),
    // Is current user following author?
    currentUserData && !isAuthor
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserData.id,
              followingId: snippet.authorId,
            },
          },
        }).then(Boolean)
      : Promise.resolve(false),
  ])

  const hasLiked = !!like
  const hasBookmarked = !!bookmark

  return (
    <div className="max-w-5xl space-y-8">
      <ViewTracker endpoint={`/api/snippets/${snippet.id}/view`} />

      {/* ── Main 2-col layout on large screens ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">

        {/* Left: snippet content */}
        <div className="space-y-6 min-w-0">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold sm:text-3xl leading-tight">{snippet.title}</h1>
              <SnippetActions snippetId={snippet.id} isAuthor={isAuthor} />
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={`/profile/${snippet.author.username ?? snippet.author.id}`}>
                <div className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={snippet.author.image || ""} />
                    <AvatarFallback className="text-sm">
                      {snippet.author.name?.charAt(0) || snippet.author.username?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {snippet.author.name || snippet.author.username}
                    </p>
                    {snippet.author.username && (
                      <p className="text-xs text-muted-foreground">@{snippet.author.username}</p>
                    )}
                  </div>
                </div>
              </Link>
              <Separator orientation="vertical" className="h-4" />
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(snippet.createdAt), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" />
                {snippet.views.toLocaleString()} views
              </span>
            </div>

            {snippet.description && (
              <p className="text-muted-foreground leading-relaxed">{snippet.description}</p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize font-medium">{snippet.language}</Badge>
              {snippet.tags.map((tag) => (
                <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted transition-colors">
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>

            {/* Social actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <LikeButton snippetId={snippet.id} initialLiked={hasLiked} initialCount={snippet._count.likes} />
              <BookmarkButton snippetId={snippet.id} initialBookmarked={hasBookmarked} initialCount={snippet._count.bookmarks} />
              <ForkButton snippetId={snippet.id} isLoggedIn={!!currentUserData} isAuthor={isAuthor} />
            </div>
          </div>

          {/* Code block */}
          <CodeBlock code={snippet.code} language={snippet.language} />

          {/* Comments */}
          <Separator />
          <CommentSection
            snippetId={snippet.id}
            currentUserId={currentUserData?.id || null}
            initialCount={snippet._count.comments}
          />
        </div>

        {/* Right: sidebar */}
        <aside className="space-y-6 lg:block">

          {/* Author card */}
          <Card className="p-4 border-border/60 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Author</p>
            <Link href={`/profile/${snippet.author.username ?? snippet.author.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Avatar className="h-10 w-10">
                <AvatarImage src={snippet.author.image || ""} />
                <AvatarFallback>{snippet.author.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold truncate">{snippet.author.name || snippet.author.username}</p>
                {snippet.author.username && (
                  <p className="text-xs text-muted-foreground">@{snippet.author.username}</p>
                )}
              </div>
            </Link>
            {snippet.author.bio && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{snippet.author.bio}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Code2 className="h-3 w-3" />
                {snippet.author._count.snippets} snippets
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {snippet.author._count.followers} followers
              </span>
            </div>
            {!isAuthor && (
              <FollowButton
                targetUserId={snippet.authorId}
                initialFollowing={!!isFollowing}
                isLoggedIn={!!currentUserData}
              />
            )}
          </Card>

          {/* More from this author */}
          {moreFromAuthor.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                More from {snippet.author.name || snippet.author.username}
              </p>
              <div className="space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(moreFromAuthor as any[]).map((s) => (
                  <Link key={s.id} href={`/snippets/${s.id}`}>
                    <Card className="p-3 border-border/60 hover:border-border hover:shadow-sm transition-all group">
                      <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{s.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 capitalize">{s.language}</Badge>
                        <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{s._count.likes}</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related snippets */}
          {relatedSnippets.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                More {snippet.language} Snippets
              </p>
              <div className="space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(relatedSnippets as any[]).map((s) => (
                  <Link key={s.id} href={`/snippets/${s.id}`}>
                    <Card className="p-3 border-border/60 hover:border-border hover:shadow-sm transition-all group">
                      <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{s.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="truncate">{s.author.name || s.author.username}</span>
                        <span className="flex items-center gap-0.5 ml-auto shrink-0">
                          <Eye className="h-2.5 w-2.5" />{s._count.likes}
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
              <Link
                href={`/feed?language=${snippet.language}&type=snippets`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse all {snippet.language} snippets →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
