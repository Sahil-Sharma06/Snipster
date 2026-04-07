import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { Pagination } from "@/components/shared/pagination"

const PAGE_SIZE = 12

interface MySnippetsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function MySnippetsPage({ searchParams }: MySnippetsPageProps) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const params = await searchParams
  const pageParam = typeof params.page === "string" ? parseInt(params.page, 10) : 1
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam

  const [snippets, totalItems, snippetViewsAgg] = await Promise.all([
    prisma.snippet.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { likes: true, comments: true, bookmarks: true } },
      },
    }),
    prisma.snippet.count({ where: { authorId: user.id } }),
    prisma.snippet.aggregate({
      where: { authorId: user.id },
      _sum: { views: true },
    })
  ])

  const totalPages = Math.ceil(totalItems / PAGE_SIZE)
  const totalViews = snippetViewsAgg._sum.views || 0

  return (
    <div className="font-['Inter'] antialiased text-[#e5e2e1] w-full max-w-7xl mx-auto -mt-6 lg:-ml-6 lg:pr-8">
      {/* Page Header & Stats */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div className="space-y-1">
          <span className="text-[#d2bbff] font-['Inter'] uppercase tracking-[0.3em] text-[10px] mb-4 block">Archive Management</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#D2BBFF]">My Snippets</h1>
          <p className="text-zinc-500 font-['Inter'] uppercase tracking-widest text-[10px] pt-2">{totalItems} Active Resources • {(totalViews / 1000).toFixed(totalViews > 1000 ? 1 : 0)}{totalViews >= 1000 ? 'k' : ''} Total Views</p>
        </div>
        <div className="flex gap-2">
          <Link href="/snippets/new">
            <button className="bg-[#7c3aed] text-[#ede0ff] font-bold px-8 py-3 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Snippet</span>
            </button>
          </Link>
        </div>
      </section>

      {totalItems === 0 ? (
         <div className="border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center p-16 transition-all hover:border-[#d2bbff]/20 hover:bg-[#d2bbff]/5 w-full">
            <div className="w-20 h-20 rounded-full bg-[#202020] flex items-center justify-center text-[#d2bbff] mb-6 shadow-inner">
               <span className="material-symbols-outlined text-4xl">code</span>
            </div>
            <h3 className="text-xl font-bold text-[#e5e2e1]">Empty Archive segment</h3>
            <p className="text-zinc-500 text-sm mt-3 text-center max-w-sm">You haven't crystallized any code blocks yet.</p>
         </div>
      ) : (
        <>
        {/* Snippets Feed (Asymmetric Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {snippets.map((snippet, idx) => {
            const isFullWidth = idx % 3 === 2;
            const isPrivate = !snippet.isPublic;
            
            return (
              <div key={snippet.id} className={`group bg-[#1b1b1c] rounded-xl overflow-hidden hover:bg-[#202020] transition-all duration-300 flex flex-col border border-white/5 ${isFullWidth ? 'lg:col-span-2' : ''}`}>
                <Link href={`/snippets/${snippet.id}`} className="flex-1 flex flex-col">
                  <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <span className={`material-symbols-outlined text-[14px] ${isPrivate ? 'text-[#7c3aed]' : 'text-[#adc6ff]'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                             {isPrivate ? 'lock' : 'public'}
                           </span>
                           <span className="text-[10px] font-bold uppercase tracking-widest text-[#958da1]">
                             {isPrivate ? 'Private' : 'Public'}
                           </span>
                        </div>
                        <h3 className="text-xl font-bold text-[#e5e2e1] tracking-tight group-hover:text-[#d2bbff] transition-colors">{snippet.title}</h3>
                      </div>
                      <span className={`px-2 py-1 flex-shrink-0 ml-2 ${isPrivate ? 'bg-[#d2bbff]/10 text-[#d2bbff]' : 'bg-[#adc6ff]/10 text-[#adc6ff]'} text-[10px] font-bold uppercase tracking-widest rounded`}>
                        {snippet.language}
                      </span>
                    </div>

                    {/* Syntax Box */}
                    <div className="bg-[#0e0e0e] rounded-lg p-4 font-mono text-[13px] leading-relaxed relative overflow-hidden shadow-inner flex-1 border border-white/5 text-[#ccc3d8]">
                      <div className="flex gap-4">
                        <div className="text-zinc-700 select-none text-right flex-shrink-0">
                          {snippet.code.split('\n').slice(0, 4).map((_, i) => <div key={i}>{String(i + 1).padStart(2, '0')}</div>)}
                        </div>
                        <div className="overflow-hidden">
                           {snippet.code.split('\n').slice(0, 4).map((line, i) => (
                              <div key={i} className="whitespace-pre truncate">{line}</div>
                           ))}
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(14,14,14,0.9)] to-transparent pointer-events-none"></div>
                    </div>
                  </div>
                </Link>

                <div className="mt-auto px-6 py-4 bg-white/5 flex gap-4 items-center border-t border-white/5">
                  <span className="text-[#958da1] text-xs"><span className="material-symbols-outlined text-[14px] align-middle mr-1">favorite</span> {snippet._count.likes}</span>
                  <span className="text-[#958da1] text-xs"><span className="material-symbols-outlined text-[14px] align-middle mr-1">chat_bubble</span> {snippet._count.comments}</span>
                  
                  <div className="ml-auto flex gap-4">
                     <Link href={`/snippets/${snippet.id}/edit`}>
                       <button className="flex items-center gap-1.5 text-[#958da1] hover:text-[#d2bbff] transition-colors">
                         <span className="material-symbols-outlined text-lg">edit</span>
                         <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Edit</span>
                       </button>
                     </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12">
          <Suspense fallback={null}>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              basePath="/my-snippets"
              itemLabel="snippets"
            />
          </Suspense>
        </div>
        </>
      )}
    </div>
  )
}
