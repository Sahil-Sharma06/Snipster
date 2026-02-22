import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Clock, Eye } from "lucide-react"
import Link from "next/link"

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
  return (
    <Link href={`/blogs/${blog.slug}`}>
      <Card className="group h-full overflow-hidden border-border/60 transition-all hover:border-border hover:shadow-lg flex flex-col">
        {/* Cover image */}
        {blog.coverImage ? (
          <div className="h-36 w-full overflow-hidden bg-muted shrink-0">
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="h-36 w-full bg-linear-to-br from-muted/60 to-muted flex items-center justify-center shrink-0">
            <span className="text-3xl font-bold text-muted-foreground/30 select-none">
              {blog.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="p-4 space-y-3 flex flex-col flex-1">
          {/* Author */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={blog.author.image || ""} />
              <AvatarFallback className="text-xs">
                {blog.author.name?.charAt(0) ||
                  blog.author.username?.charAt(0) ||
                  "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {blog.author.name || blog.author.username}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {formatDistanceToNow(
                new Date(blog.publishedAt ?? blog.createdAt),
                { addSuffix: true }
              )}
            </span>
          </div>

          {/* Title & excerpt */}
          <div className="flex-1">
            <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {blog.title}
            </h3>
            {blog.excerpt && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {blog.excerpt}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-5 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0"
            >
              Blog
            </Badge>
            {blog.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5"
              >
                {tag}
              </Badge>
            ))}
            {blog.tags.length > 2 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                +{blog.tags.length - 2}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {blog._count.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {blog._count.comments}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {blog.views}
            </span>
            {blog.readTime && (
              <span className="flex items-center gap-1 ml-auto">
                <Clock className="h-3 w-3" />
                {blog.readTime}m
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
