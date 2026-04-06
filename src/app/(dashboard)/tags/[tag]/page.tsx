import { prisma } from "@/lib/db/prisma"
import { SnippetCard } from "@/components/shared/snippet-card"
import { BlogCard } from "@/components/shared/blog-card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Code2, FileText, Hash } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface TagPageProps {
  params: Promise<{ tag: string }>
  searchParams: Promise<{ type?: string }>
}

export async function generateMetadata({ params }: TagPageProps) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  return {
    title: `#${decoded} — Snipster`,
    description: `Browse all code snippets and blog posts tagged with #${decoded} on Snipster`,
  }
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { tag } = await params
  const { type = "snippets" } = await searchParams
  const decoded = decodeURIComponent(tag)

  const [snippets, blogs, snippetCount, blogCount] = await Promise.all([
    type !== "blogs"
      ? prisma.snippet.findMany({
          where: { isPublic: true, tags: { has: decoded } },
          orderBy: { createdAt: "desc" },
          take: 24,
          include: {
            author: { select: { id: true, name: true, username: true, image: true } },
            _count: { select: { likes: true, comments: true, bookmarks: true } },
          },
        })
      : Promise.resolve([]),
    type !== "snippets"
      ? prisma.blog.findMany({
          where: { published: true, tags: { has: decoded } },
          orderBy: { publishedAt: "desc" },
          take: 24,
          include: {
            author: { select: { id: true, name: true, username: true, image: true } },
            _count: { select: { likes: true, comments: true } },
          },
        })
      : Promise.resolve([]),
    prisma.snippet.count({ where: { isPublic: true, tags: { has: decoded } } }),
    prisma.blog.count({ where: { published: true, tags: { has: decoded } } }),
  ])

  if (snippetCount === 0 && blogCount === 0) {
    notFound()
  }

  // Also fetch related tags from snippets with this tag
  const relatedSnippets = await prisma.snippet.findMany({
    where: { isPublic: true, tags: { has: decoded } },
    select: { tags: true },
    take: 50,
  })
  const tagFreq: Record<string, number> = {}
  for (const s of relatedSnippets) {
    for (const t of s.tags) {
      if (t !== decoded) tagFreq[t] = (tagFreq[t] || 0) + 1
    }
  }
  const relatedTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([t]) => t)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">{decoded}</h1>
          </div>
          <p className="text-muted-foreground">
            {snippetCount + blogCount} results —&nbsp;
            <span className="text-foreground font-medium">{snippetCount}</span> snippets
            {blogCount > 0 && (
              <>, <span className="text-foreground font-medium">{blogCount}</span> blog posts</>
            )}
          </p>
        </div>
      </div>

      {/* Related tags */}
      {relatedTags.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Related Tags</p>
          <div className="flex flex-wrap gap-2">
            {relatedTags.map((t) => (
              <Link key={t} href={`/tags/${encodeURIComponent(t)}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted transition-colors">
                  #{t}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Type tabs */}
      <div className="flex gap-2">
        <Link href={`/tags/${tag}?type=snippets`}>
          <Badge
            variant={type !== "blogs" ? "default" : "outline"}
            className="cursor-pointer gap-1.5 px-3 py-1 text-sm"
          >
            <Code2 className="h-3 w-3" />
            Snippets ({snippetCount})
          </Badge>
        </Link>
        {blogCount > 0 && (
          <Link href={`/tags/${tag}?type=blogs`}>
            <Badge
              variant={type === "blogs" ? "default" : "outline"}
              className="cursor-pointer gap-1.5 px-3 py-1 text-sm"
            >
              <FileText className="h-3 w-3" />
              Blog Posts ({blogCount})
            </Badge>
          </Link>
        )}
      </div>

      <Separator />

      {/* Snippets grid */}
      {type !== "blogs" && (
        <div>
          {snippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <Code2 className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No snippets found for #{decoded}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(snippets as any[]).map((snippet) => (
                <SnippetCard key={snippet.id} snippet={snippet} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blogs list */}
      {type === "blogs" && (
        <div>
          {blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <FileText className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No blog posts found for #{decoded}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(blogs as any[]).map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
