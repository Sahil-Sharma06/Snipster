import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { SnippetCard } from "@/components/shared/snippet-card"
import { FollowButton } from "@/components/features/follow-button"
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
  FileText,
  Heart,
  MessageCircle,
  Clock,
  Lock,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface PublicProfilePageProps {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string }>
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
    description:
      user.bio ||
      `View ${user.name || user.username}'s public snippets on Snipster`,
  }
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: PublicProfilePageProps) {
  const { username } = await params
  const { tab = "snippets" } = await searchParams

  const [profileUser, currentUser] = await Promise.all([
    prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            snippets: { where: { isPublic: true } },
            blogs: { where: { published: true } },
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

  const isFollowing = currentUser
    ? !!(await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: profileUser.id,
          },
        },
      }))
    : false

  const isOwnProfile = currentUser?.id === profileUser.id

  const [snippets, blogs, collections, followers, following] =
    await Promise.all([
      tab === "snippets"
        ? prisma.snippet.findMany({
            where: { authorId: profileUser.id, isPublic: true },
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
            where: { authorId: profileUser.id, published: true },
            orderBy: { publishedAt: "desc" },
            take: 18,
            include: { _count: { select: { likes: true, comments: true } } },
          })
        : Promise.resolve([]),

      tab === "collections"
        ? prisma.collection.findMany({
            where: { userId: profileUser.id, isPublic: true },
            orderBy: { createdAt: "desc" },
            take: 18,
            include: { _count: { select: { snippets: true } } },
          })
        : Promise.resolve([]),

      tab === "followers"
        ? prisma.follow.findMany({
            where: { followingId: profileUser.id },
            orderBy: { createdAt: "desc" },
            take: 30,
            include: {
              follower: {
                select: { id: true, name: true, username: true, image: true, bio: true },
              },
            },
          })
        : Promise.resolve([]),

      tab === "following"
        ? prisma.follow.findMany({
            where: { followerId: profileUser.id },
            orderBy: { createdAt: "desc" },
            take: 30,
            include: {
              following: {
                select: { id: true, name: true, username: true, image: true, bio: true },
              },
            },
          })
        : Promise.resolve([]),
    ])

  const stats = [
    {
      label: "Snippets",
      value: profileUser._count.snippets,
      icon: Code2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Posts",
      value: profileUser._count.blogs,
      icon: FileText,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
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
              {isOwnProfile ? (
                <a
                  href="/profile/edit"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  Edit profile →
                </a>
              ) : (
                <FollowButton
                  targetUserId={profileUser.id}
                  initialFollowing={isFollowing}
                  isLoggedIn={!!currentUser}
                />
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

      {/* Tabs */}
      <ProfileTabs activeTab={tab} username={username} />

      {/* Snippets Tab */}
      {tab === "snippets" && (
        <div>
          {snippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <Code2 className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No public snippets yet</p>
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
        <div className="space-y-4">
          {blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <FileText className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No published blog posts yet</p>
            </div>
          ) : (
            (blogs as Array<{
              id: string; title: string; slug: string; excerpt: string | null;
              tags: string[]; readTime: number | null; publishedAt: Date | null; createdAt: Date;
              _count: { likes: number; comments: number }
            }>).map((blog) => (
              <Link key={blog.id} href={`/blogs/${blog.slug}`}>
                <Card className="p-5 border-border/60 hover:border-border hover:shadow-md transition-all">
                  <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors">
                    {blog.title}
                  </h3>
                  {blog.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {blog.excerpt}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {blog.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {blog.readTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {blog.readTime} min read
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {blog._count.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {blog._count.comments}
                    </span>
                    <span>
                      {blog.publishedAt
                        ? formatDistanceToNow(new Date(blog.publishedAt), { addSuffix: true })
                        : formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Collections Tab */}
      {tab === "collections" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {collections.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <FolderOpen className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No public collections yet</p>
            </div>
          ) : (
            (collections as Array<{
              id: string; name: string; description: string | null; isPublic: boolean;
              _count: { snippets: number }
            }>).map((collection) => (
              <Link key={collection.id} href={`/collections/${collection.id}`}>
                <Card className="p-5 border-border/60 hover:border-border hover:shadow-md transition-all h-full">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold">{collection.name}</h3>
                    {!collection.isPublic && (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  {collection.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {collection.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {collection._count.snippets} snippet
                    {collection._count.snippets !== 1 ? "s" : ""}
                  </p>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Followers Tab */}
      {tab === "followers" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {followers.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <Users className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No followers yet</p>
            </div>
          ) : (
            (followers as Array<{ follower: { id: string; name: string | null; username: string | null; image: string | null; bio: string | null } }>).map(
              ({ follower }) => (
                <Link key={follower.id} href={`/profile/${follower.username}`}>
                  <Card className="flex items-center gap-3 p-4 border-border/60 hover:border-border hover:shadow-md transition-all">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={follower.image || ""} />
                      <AvatarFallback>
                        {follower.name?.charAt(0) || follower.username?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{follower.name || follower.username}</p>
                      {follower.username && (
                        <p className="text-xs text-muted-foreground">@{follower.username}</p>
                      )}
                      {follower.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{follower.bio}</p>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            )
          )}
        </div>
      )}

      {/* Following Tab */}
      {tab === "following" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {following.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <UserPlus className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Not following anyone yet</p>
            </div>
          ) : (
            (following as Array<{ following: { id: string; name: string | null; username: string | null; image: string | null; bio: string | null } }>).map(
              ({ following: followedUser }) => (
                <Link key={followedUser.id} href={`/profile/${followedUser.username}`}>
                  <Card className="flex items-center gap-3 p-4 border-border/60 hover:border-border hover:shadow-md transition-all">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={followedUser.image || ""} />
                      <AvatarFallback>
                        {followedUser.name?.charAt(0) || followedUser.username?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{followedUser.name || followedUser.username}</p>
                      {followedUser.username && (
                        <p className="text-xs text-muted-foreground">@{followedUser.username}</p>
                      )}
                      {followedUser.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{followedUser.bio}</p>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            )
          )}
        </div>
      )}
    </div>
  )
}
