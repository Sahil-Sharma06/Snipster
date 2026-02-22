import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { SnippetCard } from "@/components/shared/snippet-card"
import {
  Code2,
  FolderOpen,
  Users,
  UserPlus,
  Calendar,
  Globe,
  Github,
  Twitter,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface PublicProfilePageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PublicProfilePageProps) {
  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username },
    select: { name: true, username: true, bio: true },
  })
  if (!user) return { title: "User not found" }
  return {
    title: `${user.name || user.username} (@${user.username}) — Snipster`,
    description: user.bio || `View ${user.name || user.username}'s public snippets on Snipster`,
  }
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params

  const [profileUser, currentUser] = await Promise.all([
    prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            snippets: { where: { isPublic: true } },
            collections: { where: { isPublic: true } },
            followers: true,
            following: true,
          },
        },
      },
    }),
    getCurrentUser(),
  ])

  if (!profileUser) notFound()

  // Don't show the public profile for the current user — redirect to /profile
  // (handled via the nav, but we allow it here too)

  const snippets = await prisma.snippet.findMany({
    where: { authorId: profileUser.id, isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 12,
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

  const isOwnProfile = currentUser?.id === profileUser.id

  const stats = [
    {
      label: "Snippets",
      value: profileUser._count.snippets,
      icon: Code2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Collections",
      value: profileUser._count.collections,
      icon: FolderOpen,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Followers",
      value: profileUser._count.followers,
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Following",
      value: profileUser._count.following,
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
            <AvatarImage src={profileUser.image || ""} />
            <AvatarFallback className="text-2xl">
              {profileUser.name?.charAt(0) ||
                profileUser.username?.charAt(0) ||
                "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold">
                  {profileUser.name || profileUser.username}
                </h1>
                {profileUser.username && (
                  <p className="text-muted-foreground">
                    @{profileUser.username}
                  </p>
                )}
              </div>
              {isOwnProfile && (
                <a
                  href="/profile/edit"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Edit profile →
                </a>
              )}
            </div>
            {profileUser.bio && (
              <p className="mt-2 text-sm text-muted-foreground">
                {profileUser.bio}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined{" "}
                {formatDistanceToNow(new Date(profileUser.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {profileUser.websiteUrl && (
                <a
                  href={profileUser.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </a>
              )}
              {profileUser.githubUrl && (
                <a
                  href={profileUser.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </a>
              )}
              {profileUser.twitterUrl && (
                <a
                  href={profileUser.twitterUrl}
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
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Public Snippets */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Public Snippets</h2>
        {snippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
            <Code2 className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No public snippets yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {snippets.map((snippet) => (
              <SnippetCard key={snippet.id} snippet={snippet} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
