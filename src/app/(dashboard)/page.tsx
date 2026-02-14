import { currentUser } from "@clerk/nextjs/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { prisma } from "@/lib/db/prisma"
import { Code2, BookMarked, Users, TrendingUp } from "lucide-react"

export default async function DashboardPage() {
  const user = await currentUser()

  // Get user's snippets count
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user?.id },
    include: {
      _count: {
        select: {
          snippets: true,
          collections: true,
          followers: true,
          following: true,
        },
      },
    },
  })

  // Get recent snippets
  const recentSnippets = await prisma.snippet.findMany({
    where: {
      authorId: dbUser?.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  })

  const stats = [
    {
      name: "Snippets",
      value: dbUser?._count.snippets || 0,
      icon: Code2,
      href: "/feed",
    },
    {
      name: "Collections",
      value: dbUser?._count.collections || 0,
      icon: BookMarked,
      href: "/collections",
    },
    {
      name: "Followers",
      value: dbUser?._count.followers || 0,
      icon: Users,
      href: "/profile",
    },
    {
      name: "Following",
      value: dbUser?._count.following || 0,
      icon: TrendingUp,
      href: "/profile",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName || user?.username}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your snippets today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/snippets/new">
            <Button>Create New Snippet</Button>
          </Link>
          <Link href="/feed">
            <Button variant="outline">Browse Feed</Button>
          </Link>
        </div>
      </div>

      {/* Recent Snippets */}
      {recentSnippets.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Recent Snippets</h2>
          <div className="space-y-3">
            {recentSnippets.map((snippet) => (
              <Link key={snippet.id} href={`/snippets/${snippet.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{snippet.title}</h3>
                      {snippet.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {snippet.description}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>❤️ {snippet._count.likes}</span>
                        <span>💬 {snippet._count.comments}</span>
                        <span className="capitalize">{snippet.language}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}