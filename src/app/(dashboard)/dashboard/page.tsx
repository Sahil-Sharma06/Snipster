import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const [
    fullUser,
    snippetCount,
    totalViewsAgg,
    blogViewsAgg,
    snippetBookmarksCount,
    blogBookmarksCount,
    recentSnippets,
    languagesCount,
    communitySnippets,
    communityBlogs,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.snippet.count({ where: { authorId: user.id } }),
    prisma.snippet.aggregate({ where: { authorId: user.id }, _sum: { views: true } }),
    prisma.blog.aggregate({ where: { authorId: user.id }, _sum: { views: true } }),
    prisma.bookmark.count({ where: { snippet: { authorId: user.id } } }),
    prisma.bookmark.count({ where: { blog: { authorId: user.id } } }),
    prisma.snippet.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, title: true, code: true, language: true, updatedAt: true },
    }),
    prisma.snippet.groupBy({
      by: ["language"],
      where: { authorId: user.id },
      _count: { language: true },
      orderBy: { _count: { language: "desc" } },
      take: 5,
    }),
    prisma.snippet.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        description: true,
        code: true,
        language: true,
        createdAt: true,
        author: { select: { id: true, name: true, username: true, image: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.blog.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 2,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        createdAt: true,
        author: { select: { id: true, name: true, username: true, image: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
  ])

  if (!fullUser) redirect("/sign-in")

  const totalViews = (totalViewsAgg._sum.views ?? 0) + (blogViewsAgg._sum.views ?? 0)
  const totalSaves = snippetBookmarksCount + blogBookmarksCount
  const firstName = fullUser.name?.split(" ")[0] || fullUser.username || "Developer"

  // Format views for display
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  // Time ago helper
  const timeAgo = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)
    if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`
    if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`
    return `${Math.floor(diff / 86400)}D AGO`
  }

  // Get greeting based on time
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  // Top tags from languages
  const popularTags = languagesCount

  // Community feed items
  const feedItems = [
    ...communitySnippets.map(s => ({ ...s, kind: "snippet" as const })),
    ...communityBlogs.map(b => ({ ...b, kind: "blog" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4)

  return (
    <div className="dashboard-fade-up font-body">
      {/* Welcome Header */}
      <header className="mb-16 dashboard-fade-up dashboard-delay-1 pt-2 md:pt-3">
        <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight leading-[1.1] dashboard-title-gradient mb-4 pb-1">
          {greeting}, {firstName}.
        </h2>

      </header>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="beam-border bg-surface-container-low p-6 rounded-xl dashboard-fade-up dashboard-delay-1">
          <p className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mb-4 font-bold">
            Total Snippets
          </p>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-headline font-bold text-[#f3f4ff]">{snippetCount}</span>
            <span className="material-symbols-outlined text-sm text-[#d7dcff] dashboard-icon-arrow-rise">trending_up</span>
          </div>
        </div>

        <div className="beam-border bg-surface-container-low p-6 rounded-xl dashboard-fade-up dashboard-delay-2">
          <p className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mb-4 font-bold">
            Total Views
          </p>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-headline font-bold text-[#f3f4ff]">{formatNumber(totalViews)}</span>
            <span className="text-[#d7dcff] text-xs font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm dashboard-icon-eye-blink">visibility</span> Live
            </span>
          </div>
        </div>

        <div className="beam-border bg-surface-container-low p-6 rounded-xl dashboard-fade-up dashboard-delay-3">
          <p className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mb-4 font-bold">
            Total Saves
          </p>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-headline font-bold text-[#f3f4ff]">{totalSaves}</span>
            <div className="h-10 w-10 rounded-full bg-[#C0C1FF]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#C0C1FF] dashboard-icon-sparkle">auto_awesome</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left Column: Community Spotlight */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between mb-2 dashboard-fade-up dashboard-delay-1">
            <h3 className="text-xl font-headline font-bold text-[#eef1ff]">Community Spotlight</h3>
            <Link href="/feed" className="text-xs font-medium text-[#C0C1FF] hover:underline">
              View All Activity
            </Link>
          </div>
          {feedItems.length === 0 ? (
            <div className="bg-surface-container p-8 rounded-xl border-subtle text-center dashboard-card dashboard-fade-up dashboard-delay-2">
              <p className="text-on-surface-variant text-sm">No community activity yet. Be the first to share!</p>
            </div>
          ) : (
            feedItems.map((item) => (
              <article key={`${item.kind}-${item.id}`} className="bg-surface-container p-8 rounded-xl border-subtle dashboard-card dashboard-fade-up dashboard-delay-2">
                <div className="flex items-center gap-4 mb-6">
                  {item.author.image ? (
                    <img
                      alt={item.author.name || "Dev Avatar"}
                      className="w-10 h-10 rounded-full grayscale hover:grayscale-0 transition-all cursor-pointer"
                      src={item.author.image}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant">person</span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-[#edf0ff]">{item.author.name || item.author.username}</h4>
                    <p className="text-[11px] text-on-surface-variant uppercase tracking-wider">
                      {item.kind === "snippet" ? "Shared a snippet" : "Published an article"}
                    </p>
                  </div>
                  <span className="ml-auto text-[10px] text-on-surface-variant font-mono">
                    {timeAgo(item.createdAt)}
                  </span>
                </div>

                <p className="font-body text-[#cfd5e6] mb-6 leading-relaxed">
                  {item.kind === "snippet"
                    ? (item as any).description || `Shared a ${((item as any).language || "").toLowerCase()} snippet: ${item.title}`
                    : (item as any).excerpt || item.title
                  }
                </p>

                {item.kind === "snippet" && (item as any).code && (
                  <div className="bg-surface-container-lowest p-6 rounded-xl mb-6 font-mono text-[13px] border-subtle overflow-x-auto">
                    <pre className="text-on-surface-variant">
                      <code>{((item as any).code as string).split("\n").slice(0, 6).join("\n")}</code>
                    </pre>
                  </div>
                )}

                <div className="flex items-center gap-6">
                  <Link
                    href={item.kind === "snippet" ? `/snippets/${item.id}` : `/blogs/${(item as any).slug || item.id}`}
                    className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-[#eef1ff] transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">favorite</span>
                    {item._count.likes}
                  </Link>
                  <Link
                    href={item.kind === "snippet" ? `/snippets/${item.id}` : `/blogs/${(item as any).slug || item.id}`}
                    className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-[#eef1ff] transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">chat_bubble</span>
                    {item._count.comments}
                  </Link>
                  <Link
                    href={item.kind === "snippet" ? `/snippets/${item.id}` : `/blogs/${(item as any).slug || item.id}`}
                    className="ml-auto beam-button flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-[#eef1ff] transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Right Column: Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Quick Snippet Box */}
          <section className="bg-surface-container-low p-6 rounded-xl border-subtle dashboard-card dashboard-fade-up dashboard-delay-1">
            <h3 className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-4">
              Quick Snippet
            </h3>
            <div className="bg-surface-container-lowest p-4 rounded-lg mb-4 border-subtle">
              <textarea
                className="w-full bg-transparent border-none text-[13px] font-mono text-[#C0C1FF] focus:ring-0 placeholder:text-outline-variant/40 resize-none h-32 focus:outline-none"
                placeholder="Write code here..."
                readOnly
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Link
                  href="/snippets/new"
                  className="p-1.5 rounded bg-surface-container-highest text-[#C0C1FF] hover:text-[#eef1ff] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">attach_file</span>
                </Link>
                <Link
                  href="/snippets/new"
                  className="p-1.5 rounded bg-surface-container-highest text-[#C0C1FF] hover:text-[#eef1ff] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">terminal</span>
                </Link>
              </div>
              <Link
                href="/snippets/new"
                className="beam-button px-4 py-2 rounded-lg text-white text-[10px] font-extrabold uppercase tracking-widest active:scale-95 transition-all"
              >
                <span className="relative z-10 text-white">Initialize</span>
              </Link>
            </div>
          </section>

          {/* Your Recent Snippets */}
          <section className="bg-surface-container-low p-6 rounded-xl border-subtle dashboard-card dashboard-fade-up dashboard-delay-2">
            <h3 className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-6">
              Recent Snippets
            </h3>
            {recentSnippets.length === 0 ? (
              <p className="text-sm text-on-surface-variant/60 italic mb-4">No snippets yet. Start creating!</p>
            ) : (
              <div className="space-y-4">
                {recentSnippets.map((snippet) => (
                  <Link
                    key={snippet.id}
                    href={`/snippets/${snippet.id}`}
                    className="group block"
                  >
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#C0C1FF] text-lg mt-0.5">code</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[#eef1ff] group-hover:text-[#C0C1FF] transition-colors leading-tight truncate">
                          {snippet.title}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant mt-1 font-mono uppercase">
                          {snippet.language}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/my-snippets"
              className="block mt-4 text-xs font-medium text-[#C0C1FF] hover:text-[#eef1ff] hover:underline"
            >
               All Snippets
            </Link>
          </section>

          {/* Popular Tags */}
          <section className="bg-surface-container-low p-6 rounded-xl border-subtle dashboard-card dashboard-fade-up dashboard-delay-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-6">
              Popular Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.length === 0 ? (
                <>
                  <Link href="/tags/typescript" className="px-3 py-1.5 bg-surface-container-highest rounded-full text-[11px] font-mono text-[#d7dcff] hover:bg-[#C0C1FF] hover:text-black transition-all">#typescript</Link>
                  <Link href="/tags/rust" className="px-3 py-1.5 bg-surface-container-highest rounded-full text-[11px] font-mono text-[#d7dcff] hover:bg-[#C0C1FF] hover:text-black transition-all">#rust</Link>
                  <Link href="/tags/python" className="px-3 py-1.5 bg-surface-container-highest rounded-full text-[11px] font-mono text-[#d7dcff] hover:bg-[#C0C1FF] hover:text-black transition-all">#python</Link>
                  <Link href="/tags/go" className="px-3 py-1.5 bg-surface-container-highest rounded-full text-[11px] font-mono text-[#d7dcff] hover:bg-[#C0C1FF] hover:text-black transition-all">#go</Link>
                  <Link href="/tags/react" className="px-3 py-1.5 bg-surface-container-highest rounded-full text-[11px] font-mono text-[#d7dcff] hover:bg-[#C0C1FF] hover:text-black transition-all">#react</Link>
                </>
              ) : (
                popularTags.map((tag) => (
                  <Link
                    key={tag.language}
                    href={`/tags/${tag.language.toLowerCase()}`}
                    className="px-3 py-1.5 bg-surface-container-highest rounded-full text-[11px] font-mono text-[#d7dcff] hover:bg-[#C0C1FF] hover:text-black transition-all"
                  >
                    #{tag.language.toLowerCase()}
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}