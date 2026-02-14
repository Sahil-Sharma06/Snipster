import { currentUser } from "@clerk/nextjs/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Code2, Sparkles, Shield, Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { prisma } from "@/lib/db/prisma"

export default async function Home() {
  const user = await currentUser()

  // If user is logged in, show dashboard
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
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
        icon: Shield,
        href: "/collections",
      },
      {
        name: "Followers",
        value: dbUser?._count.followers || 0,
        icon: Zap,
        href: "/profile",
      },
      {
        name: "Following",
        value: dbUser?._count.following || 0,
        icon: Sparkles,
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

  // Landing page for non-logged-in users
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Your personal code snippet manager
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Save, Organize, and Share
            <br />
            <span className="text-primary">Your Code Snippets</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Snipster helps you organize your code snippets, share them with the
            community, and discover new solutions to common problems.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-32 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Code2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Code Management</h3>
            <p className="text-muted-foreground">
              Organize your code snippets with tags, collections, and syntax
              highlighting for multiple languages.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Private & Public</h3>
            <p className="text-muted-foreground">
              Keep your snippets private or share them with the community.
              Full control over your code visibility.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Quick search, instant copy, and blazing fast performance.
              Find what you need in seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}