import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import Link from "next/link"

interface ProfilePageProps {
  searchParams: Promise<{ tab?: "snippets" | "blogs" | "activity" | "collections" }>
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

  const [snippets, blogs, collections, activityItems] = await Promise.all([
    tab === "snippets"
      ? prisma.snippet.findMany({
          where: { authorId: user.id },
          orderBy: { createdAt: "desc" },
          take: 3, 
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
    tab === "activity"
      ? Promise.all([
          prisma.snippet.findMany({
            where: { authorId: user.id },
            orderBy: { updatedAt: "desc" },
            take: 5,
            select: {
              id: true,
              title: true,
              updatedAt: true,
              language: true,
              views: true,
              _count: { select: { likes: true, comments: true } },
            },
          }),
          prisma.blog.findMany({
            where: { authorId: user.id },
            orderBy: { updatedAt: "desc" },
            take: 5,
            select: {
              id: true,
              slug: true,
              title: true,
              updatedAt: true,
              views: true,
              _count: { select: { likes: true, comments: true } },
            },
          }),
        ]).then(([activitySnippets, activityBlogs]) => {
          const normalized = [
            ...activitySnippets.map((item) => ({
              kind: "snippet" as const,
              id: item.id,
              href: `/snippets/${item.id}`,
              title: item.title,
              updatedAt: item.updatedAt,
              views: item.views,
              meta: item.language,
              likes: item._count.likes,
              comments: item._count.comments,
            })),
            ...activityBlogs.map((item) => ({
              kind: "blog" as const,
              id: item.id,
              href: `/blogs/${item.slug}`,
              title: item.title,
              updatedAt: item.updatedAt,
              views: item.views,
              meta: "Article",
              likes: item._count.likes,
              comments: item._count.comments,
            })),
          ]

          return normalized
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 8)
        })
      : Promise.resolve([]),
  ])

  const githubUsername = fullUser.githubUrl 
    ? fullUser.githubUrl.replace(/\/$/, '').split('/').pop() 
    : ""

  const formatCompact = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`
    }
    return value.toString()
  }

  return (
    <div className="-mt-10 md:-mt-12 -mx-6 md:-mx-10 min-h-screen bg-[#0a0a0a] text-[#e5e2e1] font-body antialiased relative overflow-hidden">
      <style>{`
        @keyframes contentRise {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .card-rise {
          animation: contentRise 0.45s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .card-rise {
            animation: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-120 w-120 -translate-x-1/2 rounded-full bg-[#c0c1ff]/10 blur-[110px]" />
        <div className="absolute top-1/3 -left-14 h-80 w-80 rounded-full bg-[#8083ff]/10 blur-[100px]" />
      </div>

      <section className="max-w-6xl mx-auto px-6 md:px-10 pt-12 pb-20">
        <div className="card-rise rounded-2xl border border-white/8 bg-[#0f1012]/90 p-5 md:p-8">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-5 md:gap-6 min-w-0">
                <div className="shrink-0">
                  <img
                    alt="Profile"
                    className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover ring-1 ring-white/10"
                    src={fullUser.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuD7sqK8IEgMNoiIIePxry1ZEd7tqA6BqKf_oVmXOO-OFCwwRUh6Tu5yxA_ZppOQXCCR0TXO6A2oiOjJIcq3_U1VJxUy4BjXsdJ7_70xqAaGdxTOih73J1VHsNtbDB3r2P6YkL9CJ9cWFEyedpqWI4o8wXOILZJEmECFPg5twm7i3mAgDkgzjbJ51M2IZNMoTilaA_RV0KgRlbYu0l9G0VQzZhZ0wK_FAT-4lTqux1clIyje6keza-8YYvviwUZKuDObunsyvpdeBbQ"}
                  />
                </div>

                <div className="min-w-0">
                  <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-white tracking-tight truncate">{fullUser.name || fullUser.username}</h1>
                  <p className="text-[#b8bed7] mt-4 max-w-2xl text-sm md:text-lg leading-relaxed">
                    {fullUser.bio || "Building the architectural monolith. Obsessed with WebGPU and distributed systems."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/profile/edit" className="px-6 py-2.5 rounded-md bg-white/6 border border-white/10 text-white text-sm font-semibold transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5">
                  Edit Profile
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="beam-border bg-surface-container-low p-6 rounded-xl dashboard-fade-up dashboard-delay-1 transition-transform duration-300 hover:-translate-y-0.5">
                <p className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mb-4 font-bold">Total Snippets</p>
                <span className="text-4xl font-headline font-bold text-[#f3f4ff]">{fullUser._count.snippets}</span>
                <div className="h-1 mt-4 w-8 bg-[#9da5d9]/45" />
              </div>
              <div className="beam-border bg-surface-container-low p-6 rounded-xl dashboard-fade-up dashboard-delay-2 transition-transform duration-300 hover:-translate-y-0.5">
                <p className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mb-4 font-bold">Blog Posts</p>
                <span className="text-4xl font-headline font-bold text-[#f3f4ff]">{fullUser._count.blogs}</span>
                <div className="h-1 mt-4 w-8 bg-[#c59f74]/45" />
              </div>
              <div className="beam-border bg-surface-container-low p-6 rounded-xl dashboard-fade-up dashboard-delay-3 transition-transform duration-300 hover:-translate-y-0.5">
                <p className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mb-4 font-bold">Followers</p>
                <span className="text-4xl font-headline font-bold text-[#f3f4ff]">{formatCompact(fullUser._count.followers)}</span>
                <div className="h-1 mt-4 w-8 bg-[#9da5d9]/45" />
              </div>
              <div className="beam-border bg-surface-container-low p-6 rounded-xl dashboard-fade-up transition-transform duration-300 hover:-translate-y-0.5" style={{ animationDelay: "340ms" }}>
                <p className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mb-4 font-bold">Community Karma</p>
                <span className="text-4xl font-headline font-bold text-[#f3f4ff]">{formatCompact(fullUser._count.following + fullUser._count.followers + fullUser._count.snippets)}</span>
                <div className="h-1 mt-4 w-8 bg-[#c59f74]/45" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-b border-white/10 flex items-center gap-8 text-sm font-semibold">
          <Link href="?tab=snippets" className={`pb-3 transition-colors ${tab === "snippets" ? "text-white border-b-2 border-[#b6bbff]" : "text-zinc-500 hover:text-zinc-300"}`}>Snippets</Link>
          <Link href="?tab=blogs" className={`pb-3 transition-colors ${tab === "blogs" ? "text-white border-b-2 border-[#b6bbff]" : "text-zinc-500 hover:text-zinc-300"}`}>Blogs</Link>
          <Link href="?tab=activity" className={`pb-3 transition-colors ${tab === "activity" ? "text-white border-b-2 border-[#b6bbff]" : "text-zinc-500 hover:text-zinc-300"}`}>Activity</Link>
          <Link href="?tab=collections" className={`pb-3 transition-colors ${tab === "collections" ? "text-white border-b-2 border-[#b6bbff]" : "text-zinc-500 hover:text-zinc-300"}`}>Collections</Link>
        </div>

        <div className="mt-10">
          {tab === "snippets" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-headline font-bold text-white">Pinned Snippets</h2>
                <Link href="/my-snippets" className="text-[11px] uppercase tracking-[0.18em] text-[#b6bbff] hover:text-[#d7dcff] transition-colors">View Archive</Link>
              </div>

              {!snippets.length ? (
                <div className="bg-[#121317] border border-white/10 rounded-2xl p-12 text-center text-zinc-500">No snippets yet.</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <Link href={`/snippets/${snippets[0].id}`} className="lg:col-span-2 card-rise rounded-2xl border border-white/10 bg-[#121317] overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c0c1ff]/35">
                    <div className="px-5 py-3 border-b border-white/8 bg-white/2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff6f61]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f8c95f]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#42cc8c]" />
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">{snippets[0].title.slice(0, 20)}.{snippets[0].language.toLowerCase()}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{snippets[0].views} views</span>
                    </div>
                    <div className="p-6">
                      <pre className="font-mono text-[12px] leading-relaxed text-[#c6cbe3] overflow-x-auto">
                        <code>{snippets[0].code.split("\n").slice(0, 8).join("\n")}</code>
                      </pre>
                    </div>
                  </Link>

                  <Link href={`/snippets/${(snippets[1] || snippets[0]).id}`} className="card-rise rounded-2xl border border-white/10 bg-[#121317] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c0c1ff]/35" style={{ animationDelay: "130ms" }}>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#d5a67a] font-bold mb-4">{(snippets[1] || snippets[0]).language} / #webgpu</p>
                    <h3 className="text-2xl font-headline font-bold text-white leading-tight mb-4">{(snippets[1] || snippets[0]).title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed mb-8 line-clamp-3">{(snippets[1] || snippets[0]).description || "Efficient snippet implementation for production workloads."}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex -space-x-2">
                        <img src={fullUser.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuD7sqK8IEgMNoiIIePxry1ZEd7tqA6BqKf_oVmXOO-OFCwwRUh6Tu5yxA_ZppOQXCCR0TXO6A2oiOjJIcq3_U1VJxUy4BjXsdJ7_70xqAaGdxTOih73J1VHsNtbDB3r2P6YkL9CJ9cWFEyedpqWI4o8wXOILZJEmECFPg5twm7i3mAgDkgzjbJ51M2IZNMoTilaA_RV0KgRlbYu0l9G0VQzZhZ0wK_FAT-4lTqux1clIyje6keza-8YYvviwUZKuDObunsyvpdeBbQ"} alt="author" className="w-6 h-6 rounded-full border border-[#121317]" />
                      </div>
                      <span className="material-symbols-outlined text-zinc-400">arrow_forward</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          )}

          {tab === "blogs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {!blogs.length ? (
                <div className="col-span-full bg-[#121317] border border-white/10 rounded-2xl p-12 text-center text-zinc-500">No blogs written yet.</div>
              ) : (
                blogs.map((blog, index) => (
                  <Link key={blog.id} href={`/blogs/${blog.slug}`} className="card-rise rounded-2xl border border-white/10 bg-[#121317] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c0c1ff]/35" style={{ animationDelay: `${Math.min(index * 55, 300)}ms` }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#d5a67a] font-bold">Article</span>
                      <span className="text-xs text-zinc-500 font-mono">{blog.views} views</span>
                    </div>
                    <h3 className="text-xl font-headline font-bold text-white mb-2 line-clamp-2">{blog.title}</h3>
                    <p className="text-sm text-zinc-500 line-clamp-3 mb-6">{blog.excerpt || "Click to read more..."}</p>
                    <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                      <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                      <span>{blog._count.likes} likes</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {tab === "activity" && (
            <div className="space-y-4">
              {!activityItems.length ? (
                <div className="bg-[#121317] border border-white/10 rounded-2xl p-12 text-center text-zinc-500">No recent activity yet.</div>
              ) : (
                activityItems.map((item, index) => (
                  <Link key={`${item.kind}-${item.id}`} href={item.href} className="card-rise block rounded-xl border border-white/10 bg-[#121317] p-5 transition-all duration-300 hover:border-[#c0c1ff]/35" style={{ animationDelay: `${Math.min(index * 45, 260)}ms` }}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-2">{item.kind} • {item.meta}</p>
                        <h3 className="text-base font-bold text-white">{item.title}</h3>
                      </div>
                      <div className="text-right text-xs text-zinc-500 font-mono">
                        <p>{item.views} views</p>
                        <p>{item.likes} likes • {item.comments} comments</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {tab === "collections" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {!collections.length ? (
                <div className="col-span-full bg-[#121317] border border-white/10 rounded-2xl p-12 text-center text-zinc-500">No collections created yet.</div>
              ) : (
                collections.map((col, index) => (
                  <Link key={col.id} href={`/collections/${col.id}`} className="card-rise rounded-2xl border border-white/10 bg-[#121317] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c0c1ff]/35" style={{ animationDelay: `${Math.min(index * 55, 300)}ms` }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#7ba6e3] font-bold">Collection</span>
                      <span className="text-xs text-zinc-500 font-mono">{col._count.snippets} snippets</span>
                    </div>
                    <h3 className="text-xl font-headline font-bold text-white mb-2">{col.name}</h3>
                    <p className="text-sm text-zinc-500 line-clamp-3">{col.description || "A custom collection of snippets."}</p>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
