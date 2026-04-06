import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { SnippetCard } from "@/components/shared/snippet-card"
import {
  Code2,
  FileText,
  Users,
  UserPlus,
  Eye,
  Heart,
  FolderOpen,
  Plus,
  Pencil,
  Bell,
  ArrowRight,
  Bookmark,
  Clock,
  Globe,
  Lock,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const [
    fullUser,
    snippetCount,
    blogCount,
    publicSnippetCount,
    draftBlogCount,
    publishedBlogCount,
    snippetViewsAgg,
    blogViewsAgg,
    snippetLikesCount,
    blogLikesCount,
    snippetBookmarksCount,
    blogBookmarksCount,
    unreadNotifCount,
    recentSnippets,
    recentBlogs,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    }),
    prisma.snippet.count({ where: { authorId: user.id } }),
    prisma.blog.count({ where: { authorId: user.id } }),
    prisma.snippet.count({ where: { authorId: user.id, isPublic: true } }),
    prisma.blog.count({ where: { authorId: user.id, published: false } }),
    prisma.blog.count({ where: { authorId: user.id, published: true } }),
    prisma.snippet.aggregate({
      where: { authorId: user.id },
      _sum: { views: true },
    }),
    prisma.blog.aggregate({
      where: { authorId: user.id },
      _sum: { views: true },
    }),
    prisma.like.count({ where: { snippet: { authorId: user.id } } }),
    prisma.like.count({ where: { blog: { authorId: user.id } } }),
    prisma.bookmark.count({ where: { snippet: { authorId: user.id } } }),
    prisma.bookmark.count({ where: { blog: { authorId: user.id } } }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
    prisma.snippet.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
        _count: { select: { likes: true, comments: true, bookmarks: true } },
      },
    }),
    prisma.blog.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ])

  if (!fullUser) redirect("/sign-in")

  const totalViews =
    (snippetViewsAgg._sum.views ?? 0) + (blogViewsAgg._sum.views ?? 0)
  const totalLikes = snippetLikesCount + blogLikesCount
  const totalBookmarks = snippetBookmarksCount + blogBookmarksCount

  const statCards = [
    {
      label: "Snippets",
      value: snippetCount,
      sub: `${publicSnippetCount} public`,
      icon: Code2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/my-snippets",
    },
    {
      label: "Blog Posts",
      value: blogCount,
      sub: `${publishedBlogCount} published · ${draftBlogCount} draft`,
      icon: FileText,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      href: "/my-blogs",
    },
    {
      label: "Total Views",
      value: totalViews.toLocaleString(),
      sub: "across all content",
      icon: Eye,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
      href: null,
    },
    {
      label: "Likes Received",
      value: totalLikes.toLocaleString(),
      sub: `${totalBookmarks} bookmarks`,
      icon: Heart,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      href: null,
    },
    {
      label: "Followers",
      value: fullUser._count.followers,
      sub: "people following you",
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: `/profile/${fullUser.username ?? fullUser.id}`,
    },
    {
      label: "Following",
      value: fullUser._count.following,
      sub: "people you follow",
      icon: UserPlus,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      href: `/profile/${fullUser.username ?? fullUser.id}`,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <Card className="relative overflow-hidden p-5 border-border/60 flex items-center justify-between gap-4 flex-wrap">
        {/* Subtle bg accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative">
          <Avatar className="h-14 w-14 shrink-0 ring-2 ring-border">
            <AvatarImage src={fullUser.image ?? ""} />
            <AvatarFallback className="text-xl font-bold">
              {fullUser.name?.charAt(0) ?? fullUser.username?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold leading-tight">
              Welcome back, {fullUser.name ?? fullUser.username ?? "there"} 👋
            </h1>
            {fullUser.username && (
              <p className="text-sm text-muted-foreground">@{fullUser.username}</p>
            )}
            {fullUser.bio && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1 max-w-md">{fullUser.bio}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap relative">
          {unreadNotifCount > 0 && (
            <Link href="/notifications">
              <Button variant="outline" size="sm" className="relative border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
                <Bell className="mr-2 h-4 w-4" />
                {unreadNotifCount} unread
              </Button>
            </Link>
          )}
          <Link href="/profile/edit">
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit Profile
            </Button>
          </Link>
          <Link href={`/profile/${fullUser.username ?? fullUser.id}`}>
            <Button variant="ghost" size="sm">
              View Profile
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {statCards.map((stat, i) => {
          const inner = (
            <Card
              key={stat.label}
              className="card-shimmer relative overflow-hidden p-4 border-border/60 flex items-center gap-4 hover:border-border transition-all hover:shadow-md h-full group"
            >
              {/* Glow accent */}
              <div className={`absolute top-0 right-0 h-20 w-20 rounded-full blur-2xl opacity-[0.07] ${stat.bg} pointer-events-none`} />
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="stat-number text-2xl font-bold leading-none tabular-nums" style={{ animationDelay: `${i * 60}ms` }}>{stat.value}</p>
                <p className="text-xs font-semibold text-foreground mt-1">{stat.label}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{stat.sub}</p>
              </div>
            </Card>
          )
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="block">{inner}</Link>
          ) : (
            <div key={stat.label}>{inner}</div>
          )
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/snippets/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Snippet
            </Button>
          </Link>
          <Link href="/blogs/new">
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Blog Post
            </Button>
          </Link>
          <Link href="/collections/new">
            <Button size="sm" variant="outline">
              <FolderOpen className="mr-2 h-4 w-4" />
              New Collection
            </Button>
          </Link>
          <Link href="/search">
            <Button size="sm" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Discover People
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      {/* Recent snippets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Snippets</h2>
          <Link
            href="/my-snippets"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recentSnippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10">
            <Code2 className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No snippets yet
            </p>
            <Link href="/snippets/new">
              <Button size="sm" variant="outline">
                Create your first snippet
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentSnippets.map((snippet) => (
              <SnippetCard key={snippet.id} snippet={snippet} />
            ))}
          </div>
        )}
      </div>

      {/* Recent blog posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Blog Posts</h2>
          <Link
            href="/my-blogs"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recentBlogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10">
            <FileText className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No blog posts yet
            </p>
            <Link href="/blogs/new">
              <Button size="sm" variant="outline">
                Write your first post
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBlogs.map((blog) => (
              <Card
                key={blog.id}
                className="p-4 border-border/60 hover:border-border transition-all hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link
                        href={`/blogs/${blog.slug}`}
                        className="font-semibold truncate hover:underline"
                      >
                        {blog.title}
                      </Link>
                      <Badge
                        variant={blog.published ? "default" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {blog.published ? (
                          <>
                            <Globe className="mr-1 h-3 w-3" />
                            Published
                          </>
                        ) : (
                          <>
                            <Lock className="mr-1 h-3 w-3" />
                            Draft
                          </>
                        )}
                      </Badge>
                    </div>
                    {blog.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {blog.excerpt}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(blog.updatedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
