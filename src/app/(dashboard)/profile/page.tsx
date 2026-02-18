import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { SnippetCard } from "@/components/shared/snippet-card"
import {
  Code2,
  FolderOpen,
  Heart,
  Users,
  UserPlus,
  Calendar,
  Globe,
  Github,
  Twitter,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      _count: {
        select: {
          snippets: true,
          collections: true,
          followers: true,
          following: true,
          likes: true,
          bookmarks: true,
        },
      },
    },
  })

  if (!fullUser) redirect("/sign-in")

  const recentSnippets = await prisma.snippet.findMany({
    where: { authorId: user.id, isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 6,
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

  const stats = [
    {
      label: "Snippets",
      value: fullUser._count.snippets,
      icon: Code2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Collections",
      value: fullUser._count.collections,
      icon: FolderOpen,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
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
      color: "text-amber-500",
      bg: "bg-amber-500/10",
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
            <h1 className="text-2xl font-bold">
              {fullUser.name || fullUser.username}
            </h1>
            {fullUser.username && (
              <p className="text-muted-foreground">@{fullUser.username}</p>
            )}
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
          <Card
            key={stat.label}
            className="flex items-center gap-3 p-4 border-border/60"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
            >
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.label}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Recent Public Snippets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Public Snippets</h2>
          <Link
            href="/my-snippets"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all →
          </Link>
        </div>
        {recentSnippets.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No public snippets yet
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentSnippets.map((snippet) => (
              <SnippetCard key={snippet.id} snippet={snippet} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
