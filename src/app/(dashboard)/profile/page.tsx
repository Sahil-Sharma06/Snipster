import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { SnippetCard } from "@/components/shared/snippet-card"
import { BlogCard } from "@/components/shared/blog-card"
import { ProfileTabs } from "@/components/features/profile-tabs"
import {
  Code2,
  FolderOpen,
  Users,
  UserPlus,
  Calendar,
  Globe,
  Github,
  Twitter,
  Pencil,
  FileText,
  Heart,
  MessageCircle,
  Clock,
  Lock,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface ProfilePageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const { tab = "snippets" } = await searchParams

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      _count: {
        select: {
          snippets: true,
          blogs: { where: { published: true } },
          collections: true,
          followers: true,
          following: true,
        },
      },
    },
  })

  if (!fullUser) redirect("/sign-in")

  const [snippets, blogs, collections] = await Promise.all([
    tab === "snippets"
      ? prisma.snippet.findMany({
          where: { authorId: user.id },
          orderBy: { createdAt: "desc" },
          take: 18,
          include: {
            author: { select: { id: true, name: true, username: true, image: true } },
            _count: { select: { likes: true, comments: true, bookmarks: true } },
          },
        })
      : Promise.resolve([]),

    tab === "blogs"
      ? prisma.blog.findMany({
          where: { authorId: user.id },
          orderBy: { createdAt: "desc" },
          take: 18,
          include: {
            author: { select: { id: true, name: true, username: true, image: true } },
            _count: { select: { likes: true, comments: true } },
          },
        })
      : Promise.resolve([]),

    tab === "collections"
      ? prisma.collection.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          take: 18,
          include: { _count: { select: { snippets: true } } },
        })
      : Promise.resolve([]),
  ])

  const stats = [
    {
      label: "Snippets",
      value: fullUser._count.snippets,
      icon: Code2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Blog Posts",
      value: fullUser._count.blogs,
      icon: FileText,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Followers",
      value: fullUser._count.followers,
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Following",
      value: fullUser._count.following,
      icon: UserPlus,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <Card className="p-6 border-border/60">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={fullUser.image || ""} />
            <AvatarFallback className="text-2xl">
              {fullUser.name?.charAt(0) ||
                fullUser.username?.charAt(0) ||
                "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold">
                  {fullUser.name || fullUser.username}
                </h1>
                {fullUser.username && (
                  <p className="text-muted-foreground">@{fullUser.username}</p>
                )}
              </div>
              <Link href="/profile/edit">
                <Button variant="outline" size="sm" className="shrink-0">
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit Profile
                </Button>
              </Link>
            </div>
            {fullUser.bio && (
              <p className="mt-2 text-sm text-muted-foreground">
                {fullUser.bio}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined{" "}
                {formatDistanceToNow(new Date(fullUser.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {fullUser.websiteUrl && (
                <a
                  href={fullUser.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </a>
              )}
              {fullUser.githubUrl && (
                <a
                  href={fullUser.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </a>
              )}
              {fullUser.twitterUrl && (
                <a
                  href={fullUser.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Twitter className="h-3.5 w-3.5" />
                  Twitter
                </a>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-3 p-4 border-border/60">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Tabs  — re-use ProfileTabs (it reads ?tab= from the URL) */}
      <ProfileTabs
        activeTab={tab}
        username={fullUser.username ?? fullUser.id}
      />

      {/* Snippets Tab */}
      {tab === "snippets" && (
        <div>
          {snippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <Code2 className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-3">No snippets yet</p>
              <Link href="/snippets/new">
                <Button size="sm" variant="outline">
                  Create your first snippet
                </Button>
              </Link>
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

      {/* Blogs Tab */}
      {tab === "blogs" && (
        <div>
          {blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <FileText className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-3">No blog posts yet</p>
              <Link href="/blogs/new">
                <Button size="sm" variant="outline">
                  Write your first post
                </Button>
              </Link>
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

      {/* Collections Tab */}
      {tab === "collections" && (
        <div>
          {collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <FolderOpen className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-3">No collections yet</p>
              <Link href="/collections/new">
                <Button size="sm" variant="outline">
                  Create a collection
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(collections as Array<{
                id: string
                name: string
                description: string | null
                isPublic: boolean
                updatedAt: Date
                _count: { snippets: number }
              }>).map((collection) => (
                <Link key={collection.id} href={`/collections/${collection.id}`}>
                  <Card className="group h-full p-5 border-border/60 hover:border-border hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                        <FolderOpen className="h-5 w-5 text-violet-500" />
                      </div>
                      {!collection.isPublic && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {collection.name}
                    </h3>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {collection.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {collection._count.snippets} snippet{collection._count.snippets !== 1 ? "s" : ""}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Followers Tab */}
      {tab === "followers" && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Users className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            View your followers on your public profile
          </p>
          {fullUser.username && (
            <Link href={`/profile/${fullUser.username}?tab=followers`} className="mt-3">
              <Button size="sm" variant="outline">
                View followers
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
