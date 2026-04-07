import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import Link from "next/link"

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

  const snippetWhere: Record<string, unknown> = { isPublic: true }
  if (language) snippetWhere.language = language
  if (tag) snippetWhere.tags = { has: tag }
  if (search) snippetWhere.OR = [{ title: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }]
  
  const blogWhere: Record<string, unknown> = { published: true }
  if (tag) blogWhere.tags = { has: tag }
  if (search) blogWhere.OR = [{ title: { contains: search, mode: "insensitive" } }, { excerpt: { contains: search, mode: "insensitive" } }]

  if (isFollowingTab) {
    const follows = await prisma.follow.findMany({ where: { followerId: currentUserData!.id }, select: { followingId: true } })
    const followingIds = follows.map((f) => f.followingId)
    snippetWhere.authorId = { in: followingIds }
    blogWhere.authorId = { in: followingIds }
  }

  const authorSelect = { id: true, name: true, username: true, image: true }

  const [snippetsRaw, blogsRaw] = await Promise.all([
    type !== "blogs" ? prisma.snippet.findMany({ where: snippetWhere, orderBy: { createdAt: "desc" }, take: PAGE_SIZE, include: { author: { select: authorSelect }, _count: { select: { likes: true, comments: true, bookmarks: true } } } }) : Promise.resolve([]),
    type !== "snippets" ? prisma.blog.findMany({ where: blogWhere, orderBy: { publishedAt: "desc" }, take: PAGE_SIZE, include: { author: { select: authorSelect }, _count: { select: { likes: true, comments: true } } } }) : Promise.resolve([])
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

  return (
    <div className="font-['Inter'] antialiased max-w-6xl mx-auto md:-ml-4 lg:-ml-6 -mt-6">
      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-12 sticky top-20 z-40">
        <div className="flex gap-2 p-1 bg-[#202020]/80 backdrop-blur-md rounded-full border border-white/5">
          <Link href="?type=all" className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${type === 'all' ? 'bg-[#7c3aed] text-[#ede0ff]' : 'text-[#ccc3d8] hover:text-[#e5e2e1]'}`}>All</Link>
          <Link href="?type=snippets" className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${type === 'snippets' ? 'bg-[#7c3aed] text-[#ede0ff]' : 'text-[#ccc3d8] hover:text-[#e5e2e1]'}`}>Snippets</Link>
          <Link href="?type=blogs" className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${type === 'blogs' ? 'bg-[#7c3aed] text-[#ede0ff]' : 'text-[#ccc3d8] hover:text-[#e5e2e1]'}`}>Blogs</Link>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs font-bold uppercase tracking-tighter text-[#958da1]">
          <span>Sorting:</span>
          <button className="flex items-center gap-1 text-[#d2bbff]">
            Latest
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
        </div>
      </div>

      {feedItems.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 py-8">
           <span className="material-symbols-outlined text-4xl text-outline mb-4">search_off</span>
           <p className="text-sm font-bold text-outline">No content found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {feedItems.map((item, index) => {
            // Apply the aesthetic mapping from the HTML! 
            // We use modulo magic to recreate the asymmetric staggered feed layout!
            const layoutType = index % 3
            
            if (item.kind === "snippet") {
              const snippet = item as SnippetItem
              
              if (layoutType === 0) {
                // Layout 1: Featured Wide Snippet (col-span-12)
                return (
                  <article key={`snippet-${snippet.id}`} className="lg:col-span-12 group">
                    <Link href={`/snippets/${snippet.id}`}>
                      <div className="bg-[#2a2a2a] rounded-[2rem] overflow-hidden p-8 hover:bg-[#2F2F2F] transition-all duration-300 border border-white/5 flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-6">
                            <img alt={snippet.author.name || "Author"} className="w-10 h-10 rounded-full border border-primary/20 object-cover" src={snippet.author.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuADwuDuHA1zx3GwppIVOplAJGvP9WS_MiRvTCUzUCjsDdobgflOlGtatt1OwXQGC3oLWYWFrg_LHk6XCl9f-LQsJDYWdenOxz9hQzt-0W30Y7NQITrfMuGsZA2JiuqhaSKwQvlToIV55azzDkELuYPuCc4pUadyziqrJoCQwcpXYQNA-60uquG3Dqc4DfLFkWzVbG8O5waux8yjK-7-7KgOrfklOURDOk_cehJgdokw15nmZO5bwIj1DcQZfp3gHLA7gg7yzbyJaSMA"} />
                            <div>
                              <h4 className="text-sm font-bold text-[#e5e2e1]">{snippet.author.name || snippet.author.username}</h4>
                              <p className="text-[10px] text-[#958da1] uppercase tracking-widest">{new Date(snippet.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="ml-auto px-3 py-1 bg-primary/10 text-[#d2bbff] rounded-lg text-[10px] font-bold uppercase tracking-widest">{snippet.language}</span>
                          </div>
                          <h2 className="text-2xl font-bold mb-4 tracking-tight group-hover:text-[#d2bbff] transition-colors">{snippet.title}</h2>
                          <p className="text-[#ccc3d8] leading-relaxed text-sm mb-6 max-w-2xl line-clamp-3">
                            {snippet.description || "No description provided."}
                          </p>
                          <div className="flex items-center gap-6">
                            <span className="flex items-center gap-2 text-[#958da1] hover:text-[#d2bbff] transition-colors">
                              <span className="material-symbols-outlined text-lg">favorite</span>
                              <span className="text-xs font-bold">{snippet._count.likes}</span>
                            </span>
                            <span className="flex items-center gap-2 text-[#958da1] hover:text-[#d2bbff] transition-colors">
                              <span className="material-symbols-outlined text-lg">chat_bubble</span>
                              <span className="text-xs font-bold">{snippet._count.comments}</span>
                            </span>
                          </div>
                        </div>
                        <div className="md:w-1/3 bg-[#0e0e0e] rounded-xl p-6 relative overflow-hidden border border-white/5 flex items-center shadow-inner">
                          <div className="font-mono text-xs text-[#d2bbff] leading-relaxed overflow-hidden">
                            <pre className="whitespace-pre"><code>{snippet.code.split('\n').slice(0, 6).join('\n')}...</code></pre>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(14,14,14,0.9)] via-transparent to-transparent"></div>
                        </div>
                      </div>
                    </Link>
                  </article>
                )
              } else {
                // Layout 3 or fallback: Smaller Snippet (col-span-5 or col-span-12 if remaining)
                const colSpan = layoutType === 1 ? "lg:col-span-5" : "lg:col-span-7"
                return (
                  <article key={`snippet-${snippet.id}`} className={`${colSpan} group`}>
                    <Link href={`/snippets/${snippet.id}`}>
                      <div className="h-full bg-[#202020] rounded-[2rem] p-8 border border-white/5 hover:bg-[#2a2a2a] transition-all duration-300 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                          <span className="px-3 py-1 bg-[#adc6ff]/10 text-[#adc6ff] rounded-lg text-[10px] font-bold uppercase tracking-widest">{snippet.language}</span>
                          <span className="text-[10px] text-[#958da1] uppercase tracking-widest">{new Date(snippet.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold mb-4 tracking-tight group-hover:text-[#d2bbff] transition-colors">{snippet.title}</h3>
                        <div className="bg-[#0e0e0e] rounded-xl p-5 mb-6 font-mono text-[11px] flex-1 border border-white/5 text-zinc-400 overflow-hidden shadow-inner relative">
                          <pre className="whitespace-pre"><code>{snippet.code.split('\n').slice(0, 5).join('\n')}</code></pre>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-3">
                            <img alt={snippet.author.name || "Author"} className="w-8 h-8 rounded-full object-cover border border-white/10" src={snippet.author.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuDWPUHDjq4dnsc7Ka22G68SDBFZcxLuDs7HwtKAGj3yacIcuSA-uo-rJEvDPBsUVrxc_uXfzq6O0UWGzLS9ENuSQ3yVcKM9z63fuSaYA3QZbTyS8tE-kcYdLmPNDoQ7ktc3sYyoKxEwya-iuHHI6uF_Wh1ejiT95nVq_OOzQQELEHb6uL0I_L2LkXBxxNLDXi2M6LNkOCvS9PTtR3j5_315DFjnwE0bRL3j_4F3f_6jhfx-G05ntUHemIKzYhOAgxBprb-oWvYKX9L6"} />
                            <span className="text-xs font-bold text-[#ccc3d8]">{snippet.author.name || snippet.author.username}</span>
                          </div>
                          <div className="flex gap-4">
                            <span className="flex items-center gap-1 text-[#958da1]"><span className="material-symbols-outlined text-sm">favorite</span><span className="text-xs">{snippet._count.likes}</span></span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </article>
                )
              }
            } else {
              const blog = item as BlogItem
              
              // Blogs will take up 7 columns or 12 columns gracefully!
              const colSpan = layoutType === 1 ? "lg:col-span-7" : "lg:col-span-12"
              
              return (
                <article key={`blog-${blog.id}`} className={`${colSpan} group`}>
                  <Link href={`/blogs/${blog.slug}`}>
                    <div className={`h-full bg-[#202020] rounded-[2rem] overflow-hidden hover:bg-[#2a2a2a] transition-all duration-300 border border-white/5 ${colSpan === 'lg:col-span-12' ? 'flex flex-col md:flex-row' : ''}`}>
                      <div className={`${colSpan === 'lg:col-span-12' ? 'w-full md:w-2/5' : 'aspect-video w-full'} overflow-hidden relative`}>
                        <img alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={blog.coverImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuB2TjAX1AMNU2rkUszXYCA5cSoUWTqiQNj2WDXKzgIFPTUghqApVvTd120pydSyutpXilIcHTwjgLgmNuynpyk-yTg51y8Ar7jK3PKy7vJDD_OfpmsJVAKVWYmJhQe3Wc1oBN_INRrMLeHG9ZEtliw_oOGvKmDVY43uQ5n47vUbA0vdz283eE375tyYf3Fi-TplYyV-a5oyR1jGnevdzgBwXVatmOtvfI-01JuoTw0r3GbMKAfH9ID1x5-4M7wNeoYoIh1bfCeg0JN_"} />
                        <div className="absolute top-4 left-4">
                           <span className="text-[10px] text-[#ffdad6] font-bold uppercase tracking-[0.2em] bg-[#93000a]/80 px-2 py-1 rounded backdrop-blur-md">Article</span>
                        </div>
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-[10px] text-[#958da1] font-bold uppercase tracking-[0.2em]">{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}</span>
                          <span className="w-1 h-1 rounded-full bg-[#4a4455]"></span>
                          <span className="text-[10px] text-[#958da1] font-bold uppercase tracking-[0.2em]">{blog.readTime || 5} min read</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-tight group-hover:text-[#d2bbff] transition-colors">{blog.title}</h3>
                        <p className="text-[#ccc3d8] text-sm line-clamp-3 leading-relaxed mb-6">
                          {blog.excerpt || "Click to read the full article."}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-3">
                            <img alt={blog.author.name || "Author"} className="w-8 h-8 rounded-full border border-white/10" src={blog.author.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCVAXjNSRTuuxwFMmp6MAn1mSrUOrRdMWC9f9k1PipbnAtwNRPL-wQuViWnbKi5QJIF4vhZL7_QbNJYtpFkuBLg6JoZGF_-2HZJXaSV9I2L2tPcmqrbS0HmRZ-tJPoHu95pJl-x7Wo9xwWaXwcOHeXRDUwm8yIRm0tffKqnRAX_8o5i-3j6sXb4NI_QCaGsy8NVndhj-FdNxEMdGj0_4kbC6Z_b2OwfK1FlxhOJf94qlYT15JH-vks5OgoF0N81lNZfZEAqIXjJgf-X"} />
                            <span className="text-xs font-bold text-[#ccc3d8]">{blog.author.name || blog.author.username}</span>
                          </div>
                          <div className="flex gap-4">
                            <span className="flex items-center gap-1 text-[#958da1]"><span className="material-symbols-outlined text-sm">favorite</span><span className="text-xs">{blog._count.likes}</span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              )
            }
          })}
        </div>
      )}

      {/* Scroll Indicator */}
      {feedItems.length > 0 && (
        <div className="mt-16 flex flex-col items-center gap-4 py-8">
          <div className="w-1 h-12 rounded-full bg-gradient-to-b from-[#d2bbff] to-transparent opacity-50"></div>
          <p className="text-[10px] text-[#958da1] uppercase font-bold tracking-[0.4em]">End of Archive</p>
        </div>
      )}
    </div>
  )
}
