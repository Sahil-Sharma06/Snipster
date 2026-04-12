import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { BlogDeleteButton } from "@/components/features/blog-delete-button"
import { Pagination } from "@/components/shared/pagination"

const PAGE_SIZE = 12

interface MyBlogsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function MyBlogsPage({ searchParams }: MyBlogsPageProps) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const params = await searchParams
  const pageParam = typeof params.page === "string" ? parseInt(params.page, 10) : 1
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
  const previewParam = typeof params.preview === "string" ? params.preview : undefined

  const [blogs, totalItems, blogViewsAgg, publishedCount] = await Promise.all([
    prisma.blog.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    }),
    prisma.blog.count({ where: { authorId: user.id } }),
    prisma.blog.aggregate({ where: { authorId: user.id }, _sum: { views: true } }),
    prisma.blog.count({ where: { authorId: user.id, published: true } }),
  ])

  const draftCount = totalItems - publishedCount
  const totalPages = Math.ceil(totalItems / PAGE_SIZE)
  const totalViews = blogViewsAgg._sum.views || 0
  const selectedBlog = blogs.find((blog) => blog.id === previewParam) || blogs[0] || null
  const deleteRedirect = page > 1 ? `/my-blogs?page=${page}` : "/my-blogs"

  const formatCompact = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`
    }
    return value.toString()
  }

  const buildPreviewHref = (id: string) => {
    const nextParams = new URLSearchParams()
    if (page > 1) nextParams.set("page", String(page))
    nextParams.set("preview", id)
    return `/my-blogs?${nextParams.toString()}`
  }

  return (
    <div className="w-full max-w-375 mx-auto -mt-6 text-[#e5e2e1] font-body relative overflow-hidden">
      <style>{`
        @keyframes blogPageEnter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes blogCardEnter {
          from { opacity: 0; transform: translateY(14px) scale(0.995); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .blog-page-enter {
          animation: blogPageEnter 450ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .blog-card-enter {
          animation: blogCardEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .blog-page-enter,
          .blog-card-enter {
            animation: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-[#c0c1ff]/10 blur-[90px]" />
      </div>

      <header className="blog-page-enter flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="max-w-2xl">
          <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3 block">Architect Mode</span>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-white">Blog Library</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            {totalItems} total posts • <span className="text-primary">{formatCompact(totalViews)} views</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/blogs/new" className="beam-button px-8 py-3.5 rounded-md font-bold text-sm hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <span>Create New Blog</span>
          </Link>
        </div>
      </header>

      {totalItems === 0 ? (
        <div className="border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center p-16 text-center bg-surface-container-lowest/40">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">article</span>
          <h3 className="text-xl font-bold text-white">No blog posts yet</h3>
          <p className="text-sm text-on-surface-variant mt-2 max-w-sm mb-6">Start writing your first technical narrative.</p>
          <Link href="/blogs/new" className="beam-button px-8 py-3.5 rounded-md font-bold text-sm transition-all">
            <span>Create New Blog</span>
          </Link>
        </div>
      ) : (
        <div className="blog-page-enter grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_24rem] gap-8" style={{ animationDelay: "80ms" }}>
          <section className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-1 bg-surface-container-high text-on-surface-variant rounded border border-white/5">Published: {publishedCount}</span>
                <span className="text-[10px] px-2 py-1 bg-surface-container-high text-on-surface-variant rounded border border-white/5">Drafts: {draftCount}</span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant">Select a card to preview</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {blogs.map((blog, index) => {
                const isSelected = selectedBlog?.id === blog.id

                return (
                  <article
                    key={blog.id}
                    className={`blog-card-enter group bg-surface-container rounded-xl border transition-all duration-300 flex flex-col overflow-hidden ${
                      isSelected
                        ? "border-primary/40 shadow-[0_14px_36px_rgba(192,193,255,0.14)]"
                        : "border-white/5 hover:bg-surface-container-high hover:border-primary/20 hover:-translate-y-0.5"
                    }`}
                    style={{ animationDelay: `${Math.min(index * 45, 260)}ms` }}
                  >
                    <Link href={buildPreviewHref(blog.id)} className="h-40 relative overflow-hidden border-b border-white/5">
                      {blog.coverImage ? (
                        <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full bg-[#121317] flex items-center justify-center">
                          <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">article</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border ${blog.published ? "bg-[#c0c1ff]/20 text-[#c0c1ff] border-[#c0c1ff]/40" : "bg-[#1b1b1c]/80 text-[#958da1] border-white/10"}`}>
                          {blog.published ? "Published" : "Draft"}
                        </span>
                      </div>
                    </Link>

                    <div className="p-4 flex-1 flex flex-col">
                      <Link href={buildPreviewHref(blog.id)}>
                        <h3 className="text-base font-bold text-white line-clamp-2 group-hover:text-primary transition-colors leading-tight">{blog.title}</h3>
                      </Link>
                      <p className="mt-2 text-xs text-on-surface-variant line-clamp-2">{blog.excerpt || "Click preview to inspect your article and continue editing."}</p>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-on-surface-variant">
                        <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}</span>
                        <span>{blog.readTime || 5} min read</span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-on-surface-variant">
                        <div className="flex gap-3">
                          <span>{blog._count.likes} likes</span>
                          <span>{blog._count.comments} comments</span>
                        </div>
                        <span>{formatCompact(blog.views)} views</span>
                      </div>
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
                  basePath="/my-blogs"
                  itemLabel="posts"
                />
              </Suspense>
            </div>
          </section>

          <aside className="blog-page-enter bg-surface border border-white/5 rounded-2xl overflow-hidden shadow-2xl h-fit xl:sticky xl:top-24" style={{ animationDelay: "140ms" }}>
            {selectedBlog ? (
              <>
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-surface-container-high">
                  <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-primary text-sm">article</span>
                    <h4 className="text-xs font-bold text-white tracking-wider uppercase">Preview</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${selectedBlog.published ? "bg-[#c0c1ff]/15 text-[#c0c1ff]" : "bg-white/5 text-[#958da1]"}`}>
                    {selectedBlog.published ? "Published" : "Draft"}
                  </span>
                </div>

                {selectedBlog.coverImage && (
                  <div className="h-44 border-b border-white/5">
                    <img src={selectedBlog.coverImage} alt={selectedBlog.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-5 border-b border-white/5">
                  <h3 className="text-lg font-bold text-white mb-2 leading-tight">{selectedBlog.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                    {selectedBlog.excerpt || "No excerpt provided yet."}
                  </p>

                  {selectedBlog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedBlog.tags.slice(0, 6).map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-1 bg-surface-container-high text-on-surface-variant rounded border border-white/5">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-surface-container-low p-2 border border-white/5">
                      <p className="text-[10px] text-on-surface-variant uppercase">Views</p>
                      <p className="text-sm font-bold text-white">{formatCompact(selectedBlog.views)}</p>
                    </div>
                    <div className="bg-surface-container-low p-2 border border-white/5">
                      <p className="text-[10px] text-on-surface-variant uppercase">Likes</p>
                      <p className="text-sm font-bold text-white">{selectedBlog._count.likes}</p>
                    </div>
                    <div className="bg-surface-container-low p-2 border border-white/5">
                      <p className="text-[10px] text-on-surface-variant uppercase">Comments</p>
                      <p className="text-sm font-bold text-white">{selectedBlog._count.comments}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <Link href={`/blogs/${selectedBlog.slug}/edit`} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-sm transition-all duration-300 text-sm font-bold text-white border border-white/10 bg-white/4 hover:bg-white/8 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(192,193,255,0.15)]">
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Edit Post
                  </Link>

                  {selectedBlog.published && (
                    <Link href={`/blogs/${selectedBlog.slug}`} className="w-full beam-button flex items-center justify-center gap-2 px-8 py-3.5 rounded-md font-bold text-sm hover:-translate-y-0.5 transition-all">
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      <span>Open Blog</span>
                    </Link>
                  )}

                  <div className="w-full flex justify-center pt-2">
                    <BlogDeleteButton blogId={selectedBlog.id} slug={selectedBlog.slug} redirectTo={deleteRedirect} />
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-3 block">article</span>
                Select a blog to preview details.
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
