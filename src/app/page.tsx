import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
} from "lucide-react"

export default async function Home() {
  const user = await currentUser()
  if (user) {
    redirect("/feed")
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
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
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              Your personal code snippet manager
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Save, Organize &amp; Share{" "}
              <span className="gradient-text">Your Code Snippets</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Snipster helps you organize your code snippets, share them with
              the community, and discover new solutions to common problems.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/sign-up">
                <Button size="lg" className="h-12 px-8 text-base">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Code Preview */}
          <div className="mx-auto mt-16 max-w-3xl">
            <Card className="overflow-hidden border-border/50 shadow-2xl">
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-muted-foreground">snippet.ts</span>
              </div>
              <div className="bg-[#1e1e1e] p-6">
                <pre className="text-sm leading-relaxed">
                  <code className="text-[#d4d4d4]">{`export function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}`}</code>
                </pre>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Everything you need</h2>
            <p className="text-lg text-muted-foreground">Powerful features to help you manage, discover, and share code snippets.</p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Terminal, title: "Syntax Highlighting", description: "21 supported languages with beautiful syntax highlighting powered by Prism.", color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: FolderOpen, title: "Collections", description: "Organize snippets into collections for quick access and better workflow.", color: "text-violet-500", bg: "bg-violet-500/10" },
              { icon: Users, title: "Community Feed", description: "Discover snippets from other developers and share your own creations.", color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { icon: Heart, title: "Like & Bookmark", description: "Save your favorite snippets and show appreciation to the community.", color: "text-rose-500", bg: "bg-rose-500/10" },
              { icon: Moon, title: "Dark Mode", description: "Easy on the eyes with full dark mode support throughout the app.", color: "text-amber-500", bg: "bg-amber-500/10" },
              { icon: Search, title: "Fast Search", description: "Instantly find snippets by title, language, or tags with powerful filters.", color: "text-cyan-500", bg: "bg-cyan-500/10" },
            ].map((feature) => (
              <Card key={feature.title} className="group relative overflow-hidden border-border/50 p-6 transition-all hover:border-border hover:shadow-md">
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${feature.bg}`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="text-lg text-muted-foreground">Get started in three simple steps.</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-3">
            {[
              { step: "01", title: "Create", description: "Paste your code, select the language, and add tags for easy discovery.", icon: Code2 },
              { step: "02", title: "Organize", description: "Group snippets into collections and manage visibility with public/private controls.", icon: FolderOpen },
              { step: "03", title: "Share", description: "Publish to the community feed and discover snippets from other developers.", icon: Zap },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="mb-2 text-sm font-bold text-primary">STEP {item.step}</div>
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Ready to get started?</h2>
            <p className="mb-8 text-lg text-muted-foreground">Join Snipster today and start managing your code snippets like a pro.</p>
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-8 text-base">
                Create Your Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Code2 className="h-4 w-4" />
            <span>Snipster</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/sign-up" className="hover:text-foreground transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
