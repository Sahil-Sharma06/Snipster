import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Bookmark } from "lucide-react"
import Link from "next/link"

interface SnippetCardProps {
  snippet: {
    id: string
    title: string
    description: string | null
    code: string
    language: string
    tags: string[]
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
      bookmarks: number
    }
  }
}

export function SnippetCard({ snippet }: SnippetCardProps) {
  return (
    <Link href={`/snippets/${snippet.id}`}>
      <Card className="group h-full overflow-hidden border-border/60 transition-all hover:border-border hover:shadow-lg">
        {/* Code Preview */}
        <div className="bg-[#1e1e1e] px-4 py-3">
          <pre className="text-xs font-mono leading-relaxed text-[#d4d4d4] line-clamp-3 overflow-hidden">
            <code>{snippet.code}</code>
          </pre>
        </div>

        <div className="p-4 space-y-3">
          {/* Author */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={snippet.author.image || ""} />
              <AvatarFallback className="text-xs">
                {snippet.author.name?.charAt(0) ||
                  snippet.author.username?.charAt(0) ||
                  "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {snippet.author.name || snippet.author.username}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(snippet.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="font-semibold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
              {snippet.title}
            </h3>
            {snippet.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {snippet.description}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 capitalize">
              {snippet.language}
            </Badge>
            {snippet.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5"
              >
                {tag}
              </Badge>
            ))}
            {snippet.tags.length > 2 && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5"
              >
                +{snippet.tags.length - 2}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {snippet._count.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {snippet._count.comments}
            </span>
            <span className="flex items-center gap-1">
              <Bookmark className="h-3 w-3" />
              {snippet._count.bookmarks}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
