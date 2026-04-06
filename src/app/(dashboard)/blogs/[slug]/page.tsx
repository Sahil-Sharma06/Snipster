import { prisma } from "@/lib/db/prisma"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Calendar, Clock, Eye, Pencil } from "lucide-react"
import { LikeButton } from "@/components/features/like-button"
import { BookmarkButton } from "@/components/features/bookmark-button"
import { CommentSection } from "@/components/features/comment-section"
import { ViewTracker } from "@/components/shared/view-tracker"
import Image from "next/image"
import Link from "next/link"

interface BlogPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogPageProps) {
  const { slug } = await params
  const blog = await prisma.blog.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, coverImage: true, author: { select: { name: true, username: true } } },
  })
  if (!blog) return { title: "Post not found" }
  const author = blog.author.name || blog.author.username || "Unknown"
  return {
    title: `${blog.title} — ${author} | Snipster`,
    description: blog.excerpt || `Read "${blog.title}" by ${author} on Snipster`,
    openGraph: {
      title: blog.title,
      description: blog.excerpt || `Read "${blog.title}" by ${author} on Snipster`,
      images: blog.coverImage ? [{ url: blog.coverImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.excerpt || `Read "${blog.title}" by ${author} on Snipster`,
      images: blog.coverImage ? [blog.coverImage] : [],
    },
  }
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params
  const currentUserData = await getCurrentUser()

  const blog = await prisma.blog.findUnique({
    where: { slug },
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

  if (!blog) {
    notFound()
  }

  if (!blog.published && blog.authorId !== currentUserData?.id) {
    notFound()
  }

  const isAuthor = currentUserData?.id === blog.authorId

  let hasLiked = false
  let hasBookmarked = false

  if (currentUserData) {
    const [like, bookmark] = await Promise.all([
      prisma.like.findUnique({
        where: {
          userId_blogId: {
            userId: currentUserData.id,
            blogId: blog.id,
          },
        },
      }),
      prisma.bookmark.findUnique({
        where: {
          userId_blogId: {
            userId: currentUserData.id,
            blogId: blog.id,
          },
        },
      }),
    ])
    hasLiked = !!like
    hasBookmarked = !!bookmark
  }

  return (
    <div className="max-w-4xl space-y-6">
      <ViewTracker endpoint={`/api/blogs/${blog.slug}/view`} />
      {/* Cover Image */}
      {blog.coverImage && (
        <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-lg">
          <Image
            src={blog.coverImage}
            alt={blog.title}
            fill
            sizes="(max-width: 1200px) 100vw, 800px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold sm:text-4xl">{blog.title}</h1>
          {isAuthor && (
            <div className="flex gap-2 shrink-0">
              <Link href={`/blogs/${blog.slug}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={blog.author.image || ""} />
            <AvatarFallback>
              {blog.author.name?.charAt(0) ||
                blog.author.username?.charAt(0) ||
                "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">
              {blog.author.name || blog.author.username}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {blog.publishedAt
                ? formatDistanceToNow(new Date(blog.publishedAt), {
                    addSuffix: true,
                  })
                : formatDistanceToNow(new Date(blog.createdAt), {
                    addSuffix: true,
                  })}
              {blog.readTime && (
                <>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{blog.readTime} min read</span>
                </>
              )}
              <>
                <span>•</span>
                <Eye className="h-3 w-3" />
                <span>{blog.views.toLocaleString()} views</span>
              </>
              {!blog.published && (
                <>
                  <span>•</span>
                  <Badge variant="secondary">Draft</Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {blog.excerpt && (
          <p className="text-lg text-muted-foreground">{blog.excerpt}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {blog.tags.map((tag: string) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Social Actions */}
        {currentUserData && (
          <div className="flex items-center gap-1">
            <LikeButton
              blogId={blog.id}
              initialLiked={hasLiked}
              initialCount={blog._count.likes}
            />
            <BookmarkButton
              blogId={blog.id}
              initialBookmarked={hasBookmarked}
              initialCount={blog._count.bookmarks}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <Separator />
      <Card className="p-6 border-border/60">
        <div
          className="prose prose-slate dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </Card>

      {/* Comments */}
      <Separator />
      <CommentSection
        blogSlug={blog.slug}
        currentUserId={currentUserData?.id || null}
        initialCount={blog._count.comments}
      />
    </div>
  )
}
