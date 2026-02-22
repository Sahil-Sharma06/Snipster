import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/db/prisma"
import {
  Code2,
  Sparkles,
  Zap,
  Heart,
  FolderOpen,
  Search,
  Moon,
  ArrowRight,
  Terminal,
  Users,
  BookOpen,
  Star,
  GitFork,
  Shield,
  Globe,
} from "lucide-react"

export default async function Home() {
  const user = await currentUser()
  if (user) {
    redirect("/feed")
  }

  // Fetch live stats
  const [snippetCount, userCount, collectionCount] = await Promise.all([
    prisma.snippet.count({ where: { isPublic: true } }),
    prisma.user.count(),
    prisma.collection.count({ where: { isPublic: true } }),
  ])

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`
    return `${n}+`
  }

  const stats = [
    { label: "Code Snippets", value: formatCount(snippetCount), icon: Code2, color: "text-blue-500" },
    { label: "Developers", value: formatCount(userCount), icon: Users, color: "text-emerald-500" },
    { label: "Collections", value: formatCount(collectionCount), icon: FolderOpen, color: "text-violet-500" },
    { label: "Languages", value: "21+", icon: Globe, color: "text-amber-500" },
  ]

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-6xl">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Code2 className="h-4 w-4" />
            </div>
            <span>Snipster</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">
                Get Started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden border-b">
        <div className="container mx-auto px-4 py-20 md:py-28 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <Badge variant="outline" className="mb-6 gap-1.5 text-sm font-medium py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                Your personal code snippet manager
              </Badge>
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
                Save, Organize &amp;{" "}
                <span className="gradient-text">Share Your Code</span>
              </h1>
              <p className="mb-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
                Snipster helps developers store their code snippets, organize
                them into collections, and share with the community. Stop
                losing useful code in chat logs.
              </p>
              <div className="flex flex-col items-start gap-3 sm:flex-row">
                <Link href="/sign-up">
                  <Button size="lg" className="h-12 px-8 text-base">
                    Start for Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                    Sign In
                  </Button>
                </Link>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  Free forever
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <GitFork className="h-3.5 w-3.5 text-blue-500" />
                  Open source
                </span>
              </div>
            </div>

            {/* Right: Code preview */}
            <div className="hidden lg:block">
              <Card className="overflow-hidden border-border/50 shadow-2xl">
                <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-xs text-muted-foreground font-mono">useDebounce.ts</span>
                  <Badge variant="outline" className="ml-auto text-xs py-0 h-5">TypeScript</Badge>
                </div>
                <div className="bg-[#1e1e1e] p-6">
                  <pre className="text-sm leading-relaxed font-mono">
                    <code>
                      <span className="text-[#569cd6]">{"export function "}</span>
                      <span className="text-[#dcdcaa]">{"useDebounce"}</span>
                      <span className="text-[#d4d4d4]">{"<T>("}</span>
                      <span className="text-[#9cdcfe]">{"value"}</span>
                      <span className="text-[#d4d4d4]">{": T, "}</span>
                      <span className="text-[#9cdcfe]">{"delay"}</span>
                      <span className="text-[#d4d4d4]">{": "}</span>
                      <span className="text-[#4ec9b0]">{"number"}</span>
                      <span className="text-[#d4d4d4]">{")"}</span>
                      <span className="block mt-2 text-[#d4d4d4]">{"  const ["}</span>
                      <span className="text-[#9cdcfe]">{"    debounced, setDebounced"}</span>
                      <span className="text-[#d4d4d4]">{"] ="}</span>
                      <span className="block text-[#dcdcaa]">{"    useState"}</span>
                      <span className="text-[#d4d4d4]">{"(value)"}</span>
                      <span className="block mt-2 text-[#d4d4d4]">{"  "}</span>
                      <span className="text-[#dcdcaa]">{"useEffect"}</span>
                      <span className="text-[#d4d4d4]">{"(() => {"}</span>
                      <span className="block text-[#d4d4d4]">{"    const timer = "}</span>
                      <span className="text-[#dcdcaa]">{"setTimeout"}</span>
                      <span className="text-[#d4d4d4]">{"(timeoutFn, delay)"}</span>
                      <span className="block text-[#c586c0]">{"    return "}</span>
                      <span className="text-[#d4d4d4]">{"() => "}</span>
                      <span className="text-[#dcdcaa]">{"clearTimeout"}</span>
                      <span className="text-[#d4d4d4]">{"(timer)"}</span>
                      <span className="block text-[#d4d4d4]">{"  }, [value, delay])"}</span>
                      <span className="block mt-2 text-[#c586c0]">{"  return "}</span>
                      <span className="text-[#9cdcfe]">{"debounced"}</span>
                      <span className="block text-[#d4d4d4]">{"}"}</span>
                    </code>
                  </pre>
                </div>
                <div className="border-t bg-muted/20 px-4 py-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Heart className="h-3.5 w-3.5 text-rose-500" />
                  <span>142 likes</span>
                  <span className="ml-auto">Saved to 38 collections</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="border-b py-12 bg-muted/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center gap-2">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful tools to help you manage, discover, and share code snippets with the community.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Terminal,
                title: "Syntax Highlighting",
                description: "21 supported languages with beautiful syntax highlighting. Your code always looks great.",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                icon: FolderOpen,
                title: "Smart Collections",
                description: "Organize snippets into public or private collections. Share curated sets with your team.",
                color: "text-violet-500",
                bg: "bg-violet-500/10",
              },
              {
                icon: Users,
                title: "Community Feed",
                description: "Discover snippets from developers worldwide. Follow creators and build your network.",
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
              },
              {
                icon: Heart,
                title: "Like & Bookmark",
                description: "Save your favorites for later and show appreciation. Build your personal code library.",
                color: "text-rose-500",
                bg: "bg-rose-500/10",
              },
              {
                icon: BookOpen,
                title: "Developer Blogs",
                description: "Write long-form posts with rich text editing. Share tutorials and insights with the community.",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
              },
              {
                icon: Search,
                title: "Powerful Search",
                description: "Find snippets instantly by title, language, or tag. Filter by the exact technology you need.",
                color: "text-cyan-500",
                bg: "bg-cyan-500/10",
              },
            ].map((feature) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-border/50 p-6 transition-all hover:border-border hover:shadow-md hover:-translate-y-0.5"
              >
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${feature.bg}`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">How it works</Badge>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Up and running in minutes
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to take control of your code snippets.
            </p>
          </div>
          <div className="relative mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create an account",
                description: "Sign up in seconds with your email. No credit card required, always free.",
                icon: Zap,
                color: "bg-blue-500/10 text-blue-500",
              },
              {
                step: "02",
                title: "Save your snippets",
                description: "Paste code, pick a language, add tags. Your snippet is saved and searchable instantly.",
                icon: Code2,
                color: "bg-violet-500/10 text-violet-500",
              },
              {
                step: "03",
                title: "Share & discover",
                description: "Publish to the feed, follow developers, and build the ultimate code reference library.",
                icon: Users,
                color: "bg-emerald-500/10 text-emerald-500",
              },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < 2 && (
                  <div className="absolute top-7 left-[calc(50%+2rem)] hidden md:block w-[calc(100%-4rem)] h-px bg-border" />
                )}
                <div className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full ${item.color.split(" ")[0]}`}>
                  <item.icon className={`h-6 w-6 ${item.color.split(" ")[1]}`} />
                </div>
                <div className="mb-2 text-sm font-bold text-muted-foreground">
                  STEP {item.step}
                </div>
                <h3 className="mb-3 text-xl font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark mode preview */}
      <section className="border-t py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-xl overflow-hidden border border-border/50 shadow-xl bg-[#0d1117]">
                <div className="flex items-center gap-2 border-b border-white/10 bg-[#161b22] px-4 py-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="ml-2 text-xs text-white/40 font-mono">debounce.py</span>
                  <span className="ml-auto text-xs text-white/40">Python</span>
                </div>
                <div className="p-6 font-mono text-sm">
                  <div className="text-[#ff7b72]">{"def "}<span className="text-[#d2a8ff]">debounce</span><span className="text-[#e6edf3]">{"(func, wait):"}</span></div>
                  <div className="text-[#8b949e] mt-1 ml-4">{"# Returns a debounced version of func"}</div>
                  <div className="text-[#e6edf3] ml-4 mt-1">{"last_call = [None]"}</div>
                  <div className="mt-2 ml-4">
                    <span className="text-[#ff7b72]">{"def "}</span>
                    <span className="text-[#d2a8ff]">{"debounced"}</span>
                    <span className="text-[#e6edf3]">{"(*args):"}</span>
                  </div>
                  <div className="ml-8 text-[#e6edf3]">{"if last_call[0]:"}</div>
                  <div className="ml-12 text-[#e6edf3]">{"last_call[0].cancel()"}</div>
                  <div className="ml-8 text-[#e6edf3]">{"t = Timer(wait, func, args)"}</div>
                  <div className="ml-8 text-[#e6edf3]">{"last_call[0] = t"}</div>
                  <div className="ml-8 text-[#e6edf3]">{"t.start()"}</div>
                  <div className="mt-2 ml-4"><span className="text-[#ff7b72]">{"return "}</span><span className="text-[#e6edf3]">{"debounced"}</span></div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Badge variant="outline" className="mb-4">Dark Mode</Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Built for developers, day and night
              </h2>
              <p className="mb-6 text-lg text-muted-foreground leading-relaxed">
                Full dark mode support throughout the app. Your eyes will thank
                you during those late-night coding sessions.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {[
                  "Automatically follows your system preference",
                  "Syntax-highlighted code previews in card view",
                  "Optimized color palette for readability",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to level up your workflow?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join {formatCount(userCount)} developers already using Snipster to manage their code snippets.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="h-12 px-10 text-base">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="h-12 px-10 text-base">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Code2 className="h-3 w-3" />
              </div>
              <span>Snipster</span>
            </Link>
            <p className="text-xs text-muted-foreground text-center">
              Built for developers who value clean, reusable code.
            </p>
            <div className="flex gap-5 text-sm text-muted-foreground">
              <Link href="/sign-in" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up" className="hover:text-foreground transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
