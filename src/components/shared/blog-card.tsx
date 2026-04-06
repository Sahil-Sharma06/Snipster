"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Clock, Eye } from "lucide-react"
import Link from "next/link"

const GRADIENTS = [
  "from-violet-500/20 to-purple-500/10",
  "from-blue-500/20 to-cyan-500/10",
  "from-rose-500/20 to-pink-500/10",
  "from-amber-500/20 to-orange-500/10",
  "from-emerald-500/20 to-teal-500/10",
  "from-indigo-500/20 to-blue-500/10",
]

function getBlogGradient(title: string) {
  return GRADIENTS[title.charCodeAt(0) % GRADIENTS.length]
}

interface BlogCardProps {
  blog: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    coverImage: string | null
    tags: string[]
    readTime: number | null
    views: number
    publishedAt: Date | null
    createdAt: Date
    author: {
      id: string
      name: string | null
      username: string | null
      image: string | null
    }
    _count: {
      likes: number
      comments: number
    }
  }
}

export function BlogCard({ blog }: BlogCardProps) {
  const router = useRouter()
  const gradient = getBlogGradient(blog.title)

  return (
    <Card
      onClick={() => router.push(`/blogs/${blog.slug}`)}
      className="card-shimmer group h-full flex flex-col overflow-hidden border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-lg cursor-pointer"
    >
      {/* Cover */}
      {blog.coverImage ? (
        <div className="h-40 w-full overflow-hidden bg-muted shrink-0">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className={`h-40 w-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 relative overflow-hidden`}>
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
          <span className="text-5xl font-black text-foreground/10 select-none z-10">
            {blog.title.charAt(0).toUpperCase()}
          </span>
          <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-widest text-violet-500 bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5">
            Blog
          </span>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Author — real link */}
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${blog.author.username ?? blog.author.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarImage src={blog.author.image || ""} />
              <AvatarFallback className="text-[9px]">
                {blog.author.name?.charAt(0) || blog.author.username?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {blog.author.name || blog.author.username}
            </span>
          </Link>
          <span className="text-xs text-muted-foreground/60 ml-auto shrink-0">
            {formatDistanceToNow(new Date(blog.publishedAt ?? blog.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Title & excerpt */}
        <div className="flex-1">
          <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {blog.title}
          </h3>
          {blog.excerpt && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {blog.excerpt}
            </p>
          )}
        </div>

        {/* Tags — real links */}
        {blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {blog.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-border hover:text-foreground transition-colors"
              >
                #{tag}
              </Link>
            ))}
            {blog.tags.length > 3 && (
              <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                +{blog.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats footer */}
        <div className="flex items-center gap-3 pt-0.5 text-xs text-muted-foreground border-t border-border/40">
          <span className="flex items-center gap-1 hover:text-rose-500 transition-colors">
            <Heart className="h-3 w-3" />{blog._count.likes}
          </span>
          <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
            <MessageCircle className="h-3 w-3" />{blog._count.comments}
          </span>
          <span className="flex items-center gap-1 hover:text-sky-500 transition-colors">
            <Eye className="h-3 w-3" />{blog.views}
          </span>
          {blog.readTime && (
            <span className="flex items-center gap-1 ml-auto">
              <Clock className="h-3 w-3" />{blog.readTime} min
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
