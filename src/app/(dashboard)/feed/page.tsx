import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import Link from "next/link"
import { FollowButton } from "@/components/features/follow-button"

const PAGE_SIZE = 18

interface FeedPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams
  const search = typeof params.search === "string" ? params.search : ""
  const language = typeof params.language === "string" ? params.language : ""
  const tag = typeof params.tag === "string" ? params.tag : ""
  const tab = typeof params.tab === "string" ? params.tab : "everyone"
  const rawType = typeof params.type === "string" ? params.type : "all"
  const type = ["all", "snippets", "blogs"].includes(rawType) ? rawType : "all"
  
  const currentUserData = await getCurrentUser()
  const isFollowingTab = tab === "following" && !!currentUserData
  const followingIds = currentUserData
    ? (
        await prisma.follow.findMany({
          where: { followerId: currentUserData.id },
          select: { followingId: true },
        })
      ).map((f) => f.followingId)
    : []

  const snippetWhere: Record<string, unknown> = { isPublic: true }
  if (language) snippetWhere.language = language
  if (tag) snippetWhere.tags = { has: tag }
  if (search) snippetWhere.OR = [{ title: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }]
  
  const blogWhere: Record<string, unknown> = { published: true }
  if (tag) blogWhere.tags = { has: tag }
  if (search) blogWhere.OR = [{ title: { contains: search, mode: "insensitive" } }, { excerpt: { contains: search, mode: "insensitive" } }]

  if (isFollowingTab) {
    snippetWhere.authorId = { in: followingIds.length ? followingIds : ["__none__"] }
    blogWhere.authorId = { in: followingIds.length ? followingIds : ["__none__"] }
  }

  const authorSelect = { id: true, name: true, username: true, image: true }
  const canQueryFeed = tab !== "following" || !!currentUserData

  const [snippetsRaw, blogsRaw, trendingSnippetTags, trendingBlogTags, topCreators] = await Promise.all([
    canQueryFeed && type !== "blogs"
      ? prisma.snippet.findMany({
          where: snippetWhere,
          orderBy: { createdAt: "desc" },
          take: PAGE_SIZE,
          include: {
            author: { select: authorSelect },
            _count: { select: { likes: true, comments: true, bookmarks: true } },
          },
        })
      : Promise.resolve([]),
    canQueryFeed && type !== "snippets"
      ? prisma.blog.findMany({
          where: blogWhere,
          orderBy: { publishedAt: "desc" },
          take: PAGE_SIZE,
          include: {
            author: { select: authorSelect },
            _count: { select: { likes: true, comments: true } },
          },
        })
      : Promise.resolve([]),
    prisma.snippet.findMany({ where: { isPublic: true }, select: { tags: true }, orderBy: { createdAt: "desc" }, take: 120 }),
    prisma.blog.findMany({ where: { published: true }, select: { tags: true }, orderBy: { publishedAt: "desc" }, take: 120 }),
    prisma.user.findMany({
      where: currentUserData ? { NOT: { id: currentUserData.id } } : undefined,
      take: 3,
      orderBy: { followers: { _count: "desc" } },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: { select: { followers: true, snippets: true } },
      },
    }),
  ])

  type SnippetItem = (typeof snippetsRaw)[number] & { kind: "snippet" }
  type BlogItem = (typeof blogsRaw)[number] & { kind: "blog" }
  type FeedItem = SnippetItem | BlogItem

  const feedItems: FeedItem[] = [
    ...snippetsRaw.map((s) => ({ ...s, kind: "snippet" as const })),
    ...blogsRaw.map((b) => ({ ...b, kind: "blog" as const })),
  ].sort((a, b) => {
    const d1 = a.kind === "blog" ? ((a as BlogItem).publishedAt ?? a.createdAt) : a.createdAt
    const d2 = b.kind === "blog" ? ((b as BlogItem).publishedAt ?? b.createdAt) : b.createdAt
    return new Date(d2).getTime() - new Date(d1).getTime()
  })

  const tagFrequency: Record<string, number> = {}
  for (const item of trendingSnippetTags) {
    for (const t of item.tags) tagFrequency[t] = (tagFrequency[t] || 0) + 1
  }
  for (const item of trendingBlogTags) {
    for (const t of item.tags) tagFrequency[t] = (tagFrequency[t] || 0) + 1
  }
  const trendingTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const buildFeedHref = (
    updates: Partial<{ search: string; language: string; tag: string; tab: string; type: string }>
  ) => {
    const nextSearch = updates.search !== undefined ? updates.search : search
    const nextLanguage = updates.language !== undefined ? updates.language : language
    const nextTag = updates.tag !== undefined ? updates.tag : tag
    const nextTab = updates.tab !== undefined ? updates.tab : tab
    const nextType = updates.type !== undefined ? updates.type : type

    const qs = new URLSearchParams()
    if (nextSearch) qs.set("search", nextSearch)
    if (nextLanguage) qs.set("language", nextLanguage)
    if (nextTag) qs.set("tag", nextTag)
    if (nextTab && nextTab !== "everyone") qs.set("tab", nextTab)
    if (nextType && nextType !== "all") qs.set("type", nextType)

    const query = qs.toString()
    return query ? `/feed?${query}` : "/feed"
  }

  return (
    <div className="font-body antialiased w-full max-w-375 mx-auto -mt-6 relative overflow-hidden">
      <style>{`
        @keyframes feedEnter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes feedCardEnter {
          from { opacity: 0; transform: translateY(12px) scale(0.996); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .feed-enter { animation: feedEnter 440ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .feed-card-enter { animation: feedCardEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both; }

        @media (prefers-reduced-motion: reduce) {
          .feed-enter,
          .feed-card-enter { animation: none !important; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/3 h-80 w-80 rounded-full bg-[#c0c1ff]/10 blur-[100px]" />
      </div>

      <header className="feed-enter mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">Developer Network</p>
          <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-white tracking-tight">Feed</h1>
          <p className="text-sm text-on-surface-variant mt-2">Mixed stream of snippets and articles from the community.</p>
        </div>

        <div className="flex gap-2 p-1 bg-surface-container-low border border-white/5 rounded-md">
          <Link href={buildFeedHref({ tab: "everyone" })} className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${tab === "everyone" ? "bg-white/10 text-primary" : "text-on-surface-variant hover:text-white"}`}>
            Everyone
          </Link>
          <Link href={buildFeedHref({ tab: "following" })} className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${tab === "following" ? "bg-white/10 text-primary" : "text-on-surface-variant hover:text-white"}`}>
            Following
          </Link>
        </div>
      </header>

      <div className="feed-enter flex items-center justify-between mb-8" style={{ animationDelay: "60ms" }}>
        <div className="flex gap-2 p-1 bg-surface-container-low border border-white/5 rounded-md">
          <Link href={buildFeedHref({ type: "all" })} className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${type === "all" ? "bg-white/10 text-primary" : "text-on-surface-variant hover:text-white"}`}>
            All
          </Link>
          <Link href={buildFeedHref({ type: "snippets" })} className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${type === "snippets" ? "bg-white/10 text-primary" : "text-on-surface-variant hover:text-white"}`}>
            Snippets
          </Link>
          <Link href={buildFeedHref({ type: "blogs" })} className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${type === "blogs" ? "bg-white/10 text-primary" : "text-on-surface-variant hover:text-white"}`}>
            Articles
          </Link>
        </div>

        <div className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
          {search || tag || language ? "Filtered Feed" : "Latest Activity"}
        </div>
      </div>

      {feedItems.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 py-8">
           <span className="material-symbols-outlined text-4xl text-outline mb-4">search_off</span>
           <p className="text-sm font-bold text-outline">No content found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-8">
            {feedItems.map((item, index) => {
              if (item.kind === "blog") {
                const blog = item as BlogItem
                const isFeatured = index === 0

                if (isFeatured) {
                  return (
                    <article key={`blog-${blog.id}`} className="feed-card-enter bg-surface rounded-xl overflow-hidden border border-outline-variant/10 group" style={{ animationDelay: `${Math.min(index * 40, 220)}ms` }}>
                      <div className="aspect-21/9 w-full relative overflow-hidden">
                        <img
                          alt={blog.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          src={blog.coverImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuB3Vq9T_Qihvqojd_iHIpzwxpNNCpFGxLYB3PANDMSGQvwrzC-hmKpeh-sp6P6L7KFlqmTL_OTs0yNdFi-qsNTOWvynq-2ZV_N0yzKA98QCoQejM_PPYgC0h2O_BECkchkR3RMqYT_n55WLsKSzd201XDIHgId01lpU7O2l2aBy1dZ464Kp7QUPifrHaA-gxy2TLV3ETlASldppj17B4MdKbopK8UNXeTMaiYhAZRCKTHQn-YmVjbRNAgvsw3eOh_tPJFk8bbC70l4"}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-surface via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 flex items-center gap-3">
                          <span className="px-2 py-1 bg-primary text-on-primary-container text-[10px] font-bold rounded uppercase tracking-tighter">Feature</span>
                          <span className="text-xs text-on-surface-variant font-mono">{blog.readTime || 5} min read</span>
                        </div>
                      </div>

                      <div className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                          <img alt={blog.author.name || "Author"} className="h-10 w-10 rounded-full border border-outline-variant/30 object-cover" src={blog.author.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuANa5rwO0nnYcpZjReR83uOBQTCMh86I1gjErPP4_d4oj5XiAhUpbSuhAx2LWvqV9hrETnCBUVkIuCsX_s2Ne4iRC_EpUFDAYjlP7FWpVINeoQ3lE_Dkt9jBKuysDiM8hyEJMkL1PPNTNm1NB5MQ8zUAovsCiMKxkPCqgj7dpwFMJPc8sItr2IHzSWGWgNkYLI329BZmQK4E-xDT4g2SLqlAhKNP6gtqRkQtCE2kFfRotxfveg3pF7pFdmC9l1Ot3Il4uFOZrAVwEk"} />
                          <div>
                            <h4 className="text-sm font-semibold text-white">{blog.author.name || blog.author.username}</h4>
                            <p className="text-xs text-on-surface-variant">{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()} • {blog.readTime || 5} min read</p>
                          </div>
                        </div>
                        <Link href={`/blogs/${blog.slug}`}>
                          <h2 className="text-3xl font-headline font-extrabold tracking-tight text-white mb-4 leading-tight hover:text-primary transition-colors">{blog.title}</h2>
                        </Link>
                        <p className="text-on-surface-variant leading-relaxed mb-6 font-body line-clamp-3">{blog.excerpt || "Click to read the full article."}</p>
                        <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                          <div className="flex items-center gap-6 text-on-surface-variant">
                            <span className="flex items-center gap-2"><span className="material-symbols-outlined">expand_less</span><span className="text-sm font-bold">{blog._count.likes}</span></span>
                            <span className="flex items-center gap-2"><span className="material-symbols-outlined">chat_bubble_outline</span><span className="text-sm">{blog._count.comments}</span></span>
                          </div>
                          <Link href={`/blogs/${blog.slug}`} className="text-on-surface-variant hover:text-white transition-colors">
                            <span className="material-symbols-outlined">open_in_new</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                }

                return (
                  <article key={`blog-${blog.id}`} className="feed-card-enter bg-surface rounded-xl overflow-hidden border border-outline-variant/10 group" style={{ animationDelay: `${Math.min(index * 40, 220)}ms` }}>
                    <Link href={`/blogs/${blog.slug}`} className="block">
                      <div className="h-48 relative overflow-hidden border-b border-white/5">
                        <img
                          alt={blog.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          src={blog.coverImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuB2TjAX1AMNU2rkUszXYCA5cSoUWTqiQNj2WDXKzgIFPTUghqApVvTd120pydSyutpXilIcHTwjgLgmNuynpyk-yTg51y8Ar7jK3PKy7vJDD_OfpmsJVAKVWYmJhQe3Wc1oBN_INRrMLeHG9ZEtliw_oOGvKmDVY43uQ5n47vUbA0vdz283eE375tyYf3Fi-TplYyV-a5oyR1jGnevdzgBwXVatmOtvfI-01JuoTw0r3GbMKAfH9ID1x5-4M7wNeoYoIh1bfCeg0JN_"}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/65 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="text-[10px] text-[#ffdad6] font-bold uppercase tracking-[0.2em] bg-[#93000a]/80 px-2 py-1 rounded backdrop-blur-md">Article</span>
                        </div>
                      </div>

                      <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Article</span>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">{blog.readTime || 5} min read</span>
                      </div>
                      <h3 className="text-xl font-headline font-bold text-white mb-3 group-hover:text-primary transition-colors line-clamp-2">{blog.title}</h3>
                      <p className="text-sm text-on-surface-variant line-clamp-3 mb-4">{blog.excerpt || "Click to read more."}</p>
                      <div className="flex items-center justify-between text-xs text-on-surface-variant">
                        <span>{blog._count.likes} likes</span>
                        <span>{blog._count.comments} comments</span>
                      </div>
                      </div>
                    </Link>
                  </article>
                )
              }

              const snippet = item as SnippetItem
              return (
                <article key={`snippet-${snippet.id}`} className="feed-card-enter bg-surface rounded-xl p-6 border border-outline-variant/10" style={{ animationDelay: `${Math.min(index * 40, 220)}ms` }}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full editorial-gradient flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary-container text-sm">terminal</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{snippet.author.name || snippet.author.username}</h4>
                        <p className="text-[10px] text-on-surface-variant font-mono tracking-wider uppercase">Snippet • {snippet.language}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {snippet.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] font-mono px-2 py-1 bg-surface-container-high text-primary rounded">{t}</span>
                      ))}
                    </div>
                  </div>

                  <Link href={`/snippets/${snippet.id}`} className="block relative group">
                    <pre className="bg-surface-container-lowest p-6 rounded-lg font-mono text-sm leading-relaxed overflow-x-auto no-scrollbar border border-outline-variant/5 text-on-surface-variant"><code>{snippet.code.split("\n").slice(0, 12).join("\n")}</code></pre>
                  </Link>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <span className="flex items-center gap-2 text-on-surface-variant"><span className="material-symbols-outlined">keyboard_arrow_up</span><span className="text-sm font-bold">{snippet._count.likes}</span></span>
                      <span className="flex items-center gap-2 text-on-surface-variant"><span className="material-symbols-outlined">forum</span><span className="text-sm">{snippet._count.comments} comments</span></span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant italic">{snippet.views} views</div>
                  </div>
                </article>
              )
            })}
          </div>

          <aside className="hidden lg:col-span-4 lg:flex flex-col gap-8">
            <section className="feed-card-enter bg-surface rounded-xl p-6 border border-outline-variant/10" style={{ animationDelay: "120ms" }}>
              <h3 className="font-headline font-bold text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">trending_up</span>
                Trending Topics
              </h3>

              <div className="flex flex-col gap-3">
                {trendingTags.length === 0 ? (
                  <p className="text-xs text-on-surface-variant">No tags trending yet.</p>
                ) : (
                  trendingTags.map(([topic, count]) => (
                    <Link key={topic} href={buildFeedHref({ tag: topic })} className="group flex items-center justify-between p-3 rounded-lg hover:bg-surface-container transition-colors">
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">#{topic}</p>
                        <p className="text-[10px] text-on-surface-variant">{count} posts</p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="feed-card-enter bg-surface rounded-xl p-6 border border-outline-variant/10" style={{ animationDelay: "160ms" }}>
              <h3 className="font-headline font-bold text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">military_tech</span>
                Top Creators
              </h3>

              <div className="flex flex-col gap-5">
                {topCreators.map((creator) => (
                  <div key={creator.id} className="flex items-center justify-between gap-3">
                    <Link href={`/profile/${creator.username || creator.id}`} className="flex items-center gap-3 min-w-0">
                      <img alt={creator.name || creator.username || "Creator"} className="h-10 w-10 rounded border border-outline-variant/30 object-cover" src={creator.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuDSXQMST9leupRxc5Nsez5QZf4NMXu8G39fwBqDe20ve7-hheKK-uVyc80gKBafjbGIcg3OaH89a_nwo225bl20yv8ZOhhWMQESPyLXUZzJfXihxMvz3N18o1TY91Z9ow3DBB8RweiX1PWp5QjQDDReclnl8k2puWWhMlFrzbW6MszyylW0No0cNvcY6kHNYHweolwUdB7cdvcfVEjJl1flTSqC0dVFMotLIcxPVEcsVy6AEy9f7JMEUiknRZp3HFg8gyjHa9CSfHg"} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{creator.name || creator.username}</p>
                        <p className="text-[10px] text-on-surface-variant truncate">{creator._count.followers} followers • {creator._count.snippets} snippets</p>
                      </div>
                    </Link>

                    <FollowButton
                      targetUserId={creator.id}
                      initialFollowing={followingIds.includes(creator.id)}
                      isLoggedIn={!!currentUserData}
                    />
                  </div>
                ))}
              </div>
            </section>

          </aside>
        </div>
      )}

      {/* Scroll Indicator */}
      {feedItems.length > 0 && (
        <div className="mt-16 flex flex-col items-center gap-4 py-8">
          <div className="w-1 h-12 rounded-full bg-linear-to-b from-[#d2bbff] to-transparent opacity-50"></div>
          <p className="text-[10px] text-[#958da1] uppercase font-bold tracking-[0.4em]">End of Archive</p>
        </div>
      )}
    </div>
  )
}
