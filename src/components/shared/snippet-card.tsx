"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Bookmark, Eye } from "lucide-react"
import Link from "next/link"

const LANG_VAR: Record<string, string> = {
  javascript: "--lang-javascript",
  typescript: "--lang-typescript",
  python:     "--lang-python",
  java:       "--lang-java",
  go:         "--lang-go",
  rust:       "--lang-rust",
  php:        "--lang-php",
  ruby:       "--lang-ruby",
  swift:      "--lang-swift",
  kotlin:     "--lang-kotlin",
  csharp:     "--lang-csharp",
  cpp:        "--lang-cpp",
  c:          "--lang-c",
  html:       "--lang-html",
  css:        "--lang-css",
  scss:       "--lang-scss",
  sql:        "--lang-sql",
  bash:       "--lang-bash",
  json:       "--lang-json",
  yaml:       "--lang-yaml",
  markdown:   "--lang-markdown",
}

function getLangColor(language: string): string {
  const key = language.toLowerCase().replace(/\s+/g, "")
  return `var(${LANG_VAR[key] ?? "--lang-default"})`
}

function previewCode(code: string): string {
  return code.split("\n").slice(0, 5).join("\n")
}

interface SnippetCardProps {
  snippet: {
    id: string
    title: string
    description: string | null
    code: string
    language: string
    tags: string[]
    views?: number
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
  const router = useRouter()
  const langColor = getLangColor(snippet.language)

  return (
    <Card
      onClick={() => router.push(`/snippets/${snippet.id}`)}
      className="card-shimmer group h-full flex flex-col overflow-hidden border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-lg cursor-pointer"
    >
      {/* Language accent bar */}
      <div
        className="h-0.5 w-full shrink-0 transition-all duration-300 group-hover:h-1"
        style={{ background: langColor }}
      />

      {/* Code preview */}
      <div className="relative bg-[#0d1117] px-4 py-3 shrink-0">
        <div className="absolute top-2.5 right-3 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: langColor }} />
          <span className="text-[10px] font-medium text-white/40 capitalize">{snippet.language}</span>
        </div>
        <pre className="text-[11px] font-mono leading-relaxed text-[#8b949e] line-clamp-4 overflow-hidden pr-16">
          <code>{previewCode(snippet.code)}</code>
        </pre>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Author row — real link, stops card click propagation */}
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${snippet.author.username ?? snippet.author.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarImage src={snippet.author.image || ""} />
              <AvatarFallback className="text-[9px]">
                {snippet.author.name?.charAt(0) || snippet.author.username?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {snippet.author.name || snippet.author.username}
            </span>
          </Link>
          <span className="text-xs text-muted-foreground/60 ml-auto shrink-0">
            {formatDistanceToNow(new Date(snippet.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Title */}
        <div className="flex-1">
          <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {snippet.title}
          </h3>
          {snippet.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {snippet.description}
            </p>
          )}
        </div>

        {/* Tags — real links, stop propagation */}
        {snippet.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {snippet.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-border hover:text-foreground transition-colors"
              >
                #{tag}
              </Link>
            ))}
            {snippet.tags.length > 3 && (
              <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                +{snippet.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats footer */}
        <div className="flex items-center gap-3 pt-0.5 text-xs text-muted-foreground border-t border-border/40">
          <span className="flex items-center gap-1 hover:text-rose-500 transition-colors">
            <Heart className="h-3 w-3" />{snippet._count.likes}
          </span>
          <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
            <MessageCircle className="h-3 w-3" />{snippet._count.comments}
          </span>
          <span className="flex items-center gap-1 hover:text-amber-500 transition-colors">
            <Bookmark className="h-3 w-3" />{snippet._count.bookmarks}
          </span>
          {snippet.views !== undefined && (
            <span className="flex items-center gap-1 ml-auto">
              <Eye className="h-3 w-3" />{snippet.views.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
