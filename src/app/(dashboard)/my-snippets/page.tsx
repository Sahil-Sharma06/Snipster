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
  const previewParam = typeof params.preview === "string" ? params.preview : undefined

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
  const selectedSnippet = snippets.find((snippet) => snippet.id === previewParam) || snippets[0] || null

  const formatCompact = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`
    }
    return value.toString()
  }

  const getLangUi = (language: string) => {
    const key = language.toLowerCase()
    if (key.includes("rust")) return { icon: "terminal", tone: "text-[#ffb783] bg-orange-900/20" }
    if (key.includes("type") || key.includes("javascript")) return { icon: "javascript", tone: "text-[#c0c1ff] bg-indigo-900/20" }
    if (key.includes("python")) return { icon: "settings_ethernet", tone: "text-[#adc6ff] bg-blue-900/20" }
    if (key.includes("go")) return { icon: "integration_instructions", tone: "text-cyan-300 bg-cyan-900/20" }
    return { icon: "code", tone: "text-[#c7c4d7] bg-white/5" }
  }

  const buildPreviewHref = (id: string) => {
    const nextParams = new URLSearchParams()
    if (page > 1) nextParams.set("page", String(page))
    nextParams.set("preview", id)
    return `/my-snippets?${nextParams.toString()}`
  }

  const languageTags = Array.from(new Set(snippets.map((snippet) => snippet.language))).slice(0, 6)

  return (
    <div className="w-full max-w-375 mx-auto -mt-6 text-[#e5e2e1] font-body relative overflow-hidden">
      <style>{`
        @keyframes snippetPageEnter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes snippetCardEnter {
          from { opacity: 0; transform: translateY(14px) scale(0.995); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .snippet-page-enter {
          animation: snippetPageEnter 450ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .snippet-card-enter {
          animation: snippetCardEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .snippet-page-enter,
          .snippet-card-enter {
            animation: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-[#c0c1ff]/10 blur-[90px]" />
      </div>

      <section className="snippet-page-enter mb-8 flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">Architect Mode</p>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-white">Snippet Library</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            Showing {totalItems} snippets • <span className="text-primary">{formatCompact(totalViews)} views</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/snippets/new" className="beam-button px-8 py-3.5 rounded-md font-bold text-sm hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <span>New Snippet</span>
          </Link>
        </div>
      </section>

      {totalItems === 0 ? (
        <div className="border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center p-16 text-center bg-surface-container-lowest/40">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">code</span>
          <h3 className="text-xl font-bold text-white">No snippets yet</h3>
          <p className="text-sm text-on-surface-variant mt-2 max-w-sm">Create your first snippet to start your library.</p>
        </div>
      ) : (
        <div className="snippet-page-enter grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_24rem] gap-8" style={{ animationDelay: "80ms" }}>
          <section className="min-w-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-surface-container-high rounded-none text-on-surface-variant hover:text-white border border-white/5 text-[10px] font-bold uppercase tracking-[0.15em]" aria-label="Grid view">
                  Grid
                </button>
                <button className="px-4 py-2 bg-transparent rounded-none text-on-surface-variant/40 hover:text-white border border-white/5 text-[10px] font-bold uppercase tracking-[0.15em]" aria-label="List view">
                  List
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {languageTags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-1 bg-surface-container-high text-on-surface-variant rounded border border-white/5">
                    #{tag.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {snippets.map((snippet, index) => {
                const isPrivate = !snippet.isPublic
                const langUi = getLangUi(snippet.language)
                const isSelected = selectedSnippet?.id === snippet.id

                return (
                  <article
                    key={snippet.id}
                    className={`snippet-card-enter group bg-surface-container rounded-xl border transition-all duration-300 flex flex-col overflow-hidden ${
                      isSelected
                        ? "border-primary/40 shadow-[0_14px_36px_rgba(192,193,255,0.14)]"
                        : "border-white/5 hover:bg-surface-container-high hover:border-primary/20 hover:-translate-y-0.5"
                    }`}
                    style={{ animationDelay: `${Math.min(index * 45, 260)}ms` }}
                  >
                    <Link href={buildPreviewHref(snippet.id)} className="p-4 flex items-center justify-between border-b border-white/5">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${langUi.tone}`}>
                          <span className="material-symbols-outlined text-sm">{langUi.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{snippet.title}</h3>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">
                            {isPrivate ? "Private" : "Public"}
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_right</span>
                    </Link>

                    <Link href={buildPreviewHref(snippet.id)} className="p-4 bg-surface-container-lowest font-mono text-[11px] leading-relaxed overflow-hidden h-32 relative">
                      <pre className="text-on-surface-variant whitespace-pre-wrap wrap-break-word">
                        {snippet.code.split("\n").slice(0, 6).join("\n")}
                      </pre>
                      <div className="absolute inset-0 bg-linear-to-t from-surface-container-lowest via-transparent to-transparent" />
                    </Link>

                    <div className="p-4 flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/5">
                      <div className="flex space-x-4">
                        <span className="flex items-center"><span className="material-symbols-outlined text-xs mr-1">favorite</span>{snippet._count.likes}</span>
                        <span className="flex items-center"><span className="material-symbols-outlined text-xs mr-1">chat_bubble</span>{snippet._count.comments}</span>
                        <span className="flex items-center"><span className="material-symbols-outlined text-xs mr-1">bookmark</span>{snippet._count.bookmarks}</span>
                      </div>
                      <Link href={`/snippets/${snippet.id}/edit`} className="text-[10px] uppercase tracking-wider hover:text-white transition-colors">
                        Edit
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="mt-10">
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
          </section>

          <aside className="snippet-page-enter bg-surface border border-white/5 rounded-2xl overflow-hidden shadow-2xl h-fit xl:sticky xl:top-24" style={{ animationDelay: "140ms" }}>
            {selectedSnippet ? (
              <>
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-surface-container-high">
                  <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-primary text-sm">visibility</span>
                    <h4 className="text-xs font-bold text-white tracking-wider uppercase">Preview</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                    {selectedSnippet.language}
                  </span>
                </div>

                <div className="p-5 border-b border-white/5">
                  <h3 className="text-lg font-bold text-white mb-2 truncate">{selectedSnippet.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                    {selectedSnippet.description || "Reusable snippet from your personal archive."}
                  </p>

                  <div className="rounded-xl overflow-hidden border border-white/5 shadow-inner">
                    <div className="bg-surface-container px-3 py-2 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-on-surface-variant truncate">{selectedSnippet.title}.{selectedSnippet.language.toLowerCase()}</span>
                      <span className="text-[10px] font-mono text-on-surface-variant">{selectedSnippet.views} views</span>
                    </div>
                    <div className="bg-[#0e0e0e] p-4 font-mono text-xs leading-relaxed overflow-x-auto max-h-72">
                      <pre className="text-on-surface-variant whitespace-pre-wrap wrap-break-word">{selectedSnippet.code.split("\n").slice(0, 24).join("\n")}</pre>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <Link
                    href={`/snippets/${selectedSnippet.id}`}
                    className="w-full beam-button flex items-center justify-center gap-2 px-8 py-3.5 rounded-md font-bold text-sm hover:-translate-y-0.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    <span>Open Snippet</span>
                  </Link>

                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href={`/snippets/${selectedSnippet.id}/edit`}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-sm transition-all duration-300 text-sm font-bold text-white border border-white/10 bg-white/4 hover:bg-white/8 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(192,193,255,0.15)]"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Edit
                    </Link>
                    <Link
                      href="/snippets/new"
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-sm transition-all duration-300 text-sm font-bold text-white border border-white/10 bg-white/4 hover:bg-white/8 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(192,193,255,0.15)]"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      New
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-3 block">visibility</span>
                Select a snippet to preview details.
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
