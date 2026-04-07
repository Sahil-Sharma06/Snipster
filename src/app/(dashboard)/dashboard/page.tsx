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
    snippetViewsAgg,
    blogViewsAgg,
    snippetBookmarksCount,
    blogBookmarksCount,
    recentSnippets,
    recentBlogs,
    languagesCount
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.snippet.count({ where: { authorId: user.id } }),
    prisma.snippet.aggregate({
      where: { authorId: user.id },
      _sum: { views: true },
    }),
    prisma.blog.aggregate({
      where: { authorId: user.id },
      _sum: { views: true },
    }),
    prisma.bookmark.count({ where: { snippet: { authorId: user.id } } }),
    prisma.bookmark.count({ where: { blog: { authorId: user.id } } }),
    prisma.snippet.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 2,
    }),
    prisma.blog.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 2,
    }),
    prisma.snippet.groupBy({
      by: ["language"],
      where: { authorId: user.id },
      _count: { language: true },
      orderBy: { _count: { language: "desc" } },
      take: 4
    })
  ])

  if (!fullUser) redirect("/sign-in")

  const totalViews = (snippetViewsAgg._sum.views ?? 0) + (blogViewsAgg._sum.views ?? 0)
  const totalSaves = snippetBookmarksCount + blogBookmarksCount

  // Safely structure recent drafts (mix of snippets and blogs)
  const recentDrafts = [
    ...recentSnippets.map(s => ({ ...s, kind: 'snippet' as const })),
    ...recentBlogs.map(b => ({ ...b, kind: 'blog' as const }))
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4)

  // Determine top languages
  const languageColors: Record<string, string> = {
    'typescript': 'bg-[#d2bbff]',
    'rust': 'bg-[#adc6ff]',
    'go': 'bg-[#7c3aed]',
    'python': 'bg-zinc-500',
    'javascript': 'bg-[#d2bbff]',
    'java': 'bg-amber-500',
    'c++': 'bg-rose-500',
    'ruby': 'bg-emerald-500'
  }
  
  const stackBreakdown = languagesCount.map(lang => ({
    name: lang.language,
    count: lang._count.language,
    percentage: Math.round((lang._count.language / Math.max(1, snippetCount)) * 100),
    color: languageColors[lang.language.toLowerCase()] || 'bg-[#4a4455]'
  }))

  // Generate heatmap matrix deterministically based on user id and date
  const generateHeatmapGrid = () => {
    const cols = []
    const seed = fullUser.id.charCodeAt(0) + new Date().getDay()
    for(let i = 0; i < 26; i++) {
        const rows = []
        for(let j = 0; j < 7; j++) {
            // pseudo-random but stable density
            const val = ((i * j * seed) % 100)
            if (val < 40) rows.push('bg-[#0e0e0e]')
            else if (val < 65) rows.push('bg-[#d2bbff]/20')
            else if (val < 85) rows.push('bg-[#d2bbff]/40')
            else if (val < 95) rows.push('bg-[#d2bbff]/60')
            else rows.push('bg-[#d2bbff]')
        }
        cols.push(rows)
    }
    return cols
  }

  const heatmap = generateHeatmapGrid()

  return (
    <div className="font-['Inter'] antialiased md:-ml-4 lg:-ml-6 -mt-6">
      <div className="px-4 md:px-8 py-10 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <section className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-[#e5e2e1]">Welcome back, {fullUser.name?.split(' ')[0] || fullUser.username}.</h1>
          <p className="text-zinc-500 font-medium max-w-2xl leading-relaxed italic border-l-2 border-[#7c3aed]/50 pl-6 text-sm md:text-base">
            "Code is like humor. When you have to explain it, it’s bad. Keep your snippets kinetic and your logic lean."
          </p>
        </section>

        {/* Stat Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-[#2a2a2a]/40 backdrop-blur-md border border-white/5 p-6 rounded-[1.5rem] group hover:bg-[#2a2a2a]/80 transition-all duration-300">
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#958da1] mb-2">Total Views</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-[#e5e2e1]">{(totalViews / 1000).toFixed(totalViews > 1000 ? 1 : 0)}{totalViews >= 1000 ? 'k' : ''}</span>
              <span className="text-[#d2bbff] material-symbols-outlined scale-125 group-hover:scale-150 transition-transform origin-bottom-right">visibility</span>
            </div>
          </div>
          
          <div className="bg-[#2a2a2a]/40 backdrop-blur-md border border-white/5 p-6 rounded-[1.5rem] group hover:bg-[#2a2a2a]/80 transition-all duration-300">
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#958da1] mb-2">Total Saves</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-[#e5e2e1]">{totalSaves}</span>
              <span className="text-[#d2bbff] material-symbols-outlined scale-125 group-hover:scale-150 transition-transform origin-bottom-right">bookmark</span>
            </div>
          </div>
          
          <div className="bg-[#2a2a2a]/40 backdrop-blur-md border border-white/5 p-6 rounded-[1.5rem] group hover:bg-[#2a2a2a]/80 transition-all duration-300">
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#958da1] mb-2">Snippets Created</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-[#e5e2e1]">{snippetCount}</span>
              <span className="text-[#d2bbff] material-symbols-outlined scale-125 group-hover:scale-150 transition-transform origin-bottom-right">code_blocks</span>
            </div>
          </div>
          
          <div className="bg-[#7c3aed]/20 backdrop-blur-md border border-[#7c3aed]/20 p-6 rounded-[1.5rem] group hover:bg-[#7c3aed]/30 transition-all duration-300">
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#d2bbff] mb-2">Platform Days</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-[#d2bbff]">
                {Math.max(1, Math.floor((new Date().getTime() - new Date(fullUser.createdAt).getTime()) / (1000 * 3600 * 24)))}
              </span>
              <span className="text-[#d2bbff] material-symbols-outlined scale-125 animate-pulse origin-bottom-right" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            </div>
          </div>
        </section>

        {/* Activity Pulse & Content Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Heatmap */}
          <div className="lg:col-span-2 bg-[#202020] p-8 rounded-[2rem] border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm uppercase font-black tracking-widest text-[#ccc3d8]">Activity Pulse</h3>
              <div className="hidden sm:flex gap-2 items-center text-[10px] text-[#958da1] font-bold tracking-wider uppercase">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-[#0e0e0e] rounded-sm"></div>
                  <div className="w-3 h-3 bg-[#d2bbff]/20 rounded-sm"></div>
                  <div className="w-3 h-3 bg-[#d2bbff]/40 rounded-sm"></div>
                  <div className="w-3 h-3 bg-[#d2bbff]/60 rounded-sm"></div>
                  <div className="w-3 h-3 bg-[#d2bbff] rounded-sm shadow-[0_0_8px_rgba(210,187,255,0.4)]"></div>
                </div>
                <span>More</span>
              </div>
            </div>
            
            <div className="w-full overflow-x-auto hide-scrollbar">
              <div className="flex gap-1 min-w-max pb-2">
                {heatmap.map((col, cIdx) => (
                  <div key={cIdx} className="space-y-1">
                    {col.map((color, rIdx) => (
                      <div key={rIdx} className={`h-3 w-3 ${color} rounded-sm transition-colors hover:border hover:border-white/50 cursor-crosshair`}></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Language Distribution */}
          <div className="bg-[#202020] p-8 rounded-[2rem] border border-white/5">
            <h3 className="text-sm uppercase font-black tracking-widest text-[#ccc3d8] mb-8">Stack Breakdown</h3>
            <div className="space-y-6">
              {stackBreakdown.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">No snippets created yet. Start coding to build your stack!</p>
              ) : stackBreakdown.map((stack) => (
                <div key={stack.name}>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[#958da1] mb-2">
                    <span>{stack.name}</span>
                    <span>{stack.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0e0e0e] rounded-full overflow-hidden shadow-inner">
                    <div className={`${stack.color} h-full transition-all duration-1000 ease-in-out`} style={{ width: `${stack.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Jump Back In */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm uppercase font-black tracking-widest text-[#ccc3d8]">Jump Back In</h3>
            <Link href="/my-snippets" className="text-[10px] font-bold uppercase tracking-widest text-[#d2bbff] hover:text-white transition-colors">View All Drafts</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentDrafts.length === 0 ? (
               <div className="col-span-full border border-dashed border-white/10 rounded-[1.5rem] p-12 text-center flex flex-col items-center justify-center">
                 <span className="material-symbols-outlined text-4xl text-zinc-600 mb-4">edit_square</span>
                 <p className="text-zinc-500 font-medium">Your desk is clear. Start creating something amazing.</p>
               </div>
            ) : recentDrafts.map((draft) => (
              <Link 
                key={`${draft.kind}-${draft.id}`} 
                href={draft.kind === 'snippet' ? `/snippets/${draft.id}` : `/blogs/${(draft as any).slug || draft.id}`}
              >
                <div className="group bg-[#1b1b1c] hover:bg-[#2a2a2a] p-6 lg:p-8 rounded-[1.5rem] border border-white/5 transition-all duration-300 cursor-pointer h-full flex flex-col">
                  <div className="flex items-start justify-between mb-6">
                    <div className="pr-4">
                      <h4 className="text-lg font-bold text-[#e5e2e1] group-hover:text-[#d2bbff] transition-colors leading-tight">{draft.title}</h4>
                      <p className="text-xs text-zinc-500 mt-2 font-mono uppercase tracking-tighter">Edited {new Date(draft.updatedAt).toLocaleDateString()} • {draft.kind === 'snippet' ? 'Snippet' : 'Blog'}</p>
                    </div>
                    <span className="material-symbols-outlined text-zinc-600 group-hover:text-[#d2bbff] transition-colors">arrow_forward</span>
                  </div>
                  
                  {draft.kind === 'snippet' && (draft as any).code && (
                    <div className="bg-[#0e0e0e] p-4 rounded-xl mb-6 shadow-inner border border-white/5">
                      <code className="text-xs font-mono text-[#958da1] block line-clamp-3 leading-relaxed">
                        {((draft as any).code).split('\n').map((line: string, i: number) => <div key={i}>{line}</div>)}
                      </code>
                    </div>
                  )}

                  {draft.kind === 'blog' && (draft as any).excerpt && (
                    <div className="bg-[#0e0e0e] p-4 rounded-xl mb-6 shadow-inner border border-white/5">
                      <p className="text-xs text-[#958da1] block line-clamp-3 leading-relaxed italic border-l-2 border-[#93000a] pl-3">
                        {((draft as any).excerpt)}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-2">
                    {draft.kind === 'snippet' && (draft as any).language && (
                      <span className="px-2 py-1 bg-[#2a2a2a] group-hover:bg-[#353535] text-[10px] uppercase font-bold tracking-widest text-[#ccc3d8] rounded transition-colors group-hover:text-white border border-white/5">{(draft as any).language}</span>
                    )}
                    {draft.kind === 'blog' && (
                       <span className="px-2 py-1 bg-[#2a2a2a] group-hover:bg-[#353535] text-[10px] uppercase font-bold tracking-widest text-[#ccc3d8] rounded transition-colors group-hover:text-white border border-white/5">Article Content</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
