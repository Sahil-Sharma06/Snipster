import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { BlogDeleteButton } from "@/components/features/blog-delete-button"

export default async function MyBlogsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const blogs = await prisma.blog.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  })

  return (
    <div className="font-['Inter'] antialiased w-full max-w-7xl mx-auto -mt-6 lg:-ml-6 lg:pr-8">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div className="max-w-xl space-y-1">
          <span className="text-[#d2bbff] uppercase tracking-[0.3em] text-[10px] mb-4 block">Archive Management</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#e5e2e1] leading-none mb-4">My Blogs</h1>
          <p className="text-[#958da1] text-sm md:text-base leading-relaxed pt-2">Manage your technical narratives and editorial drafts. Precisely crafted for the modern architect.</p>
        </div>
        <div>
          <Link href="/blogs/new">
             <button className="group flex items-center gap-3 bg-[#7c3aed] text-white font-bold px-8 py-3.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#7c3aed]/10">
               <span className="material-symbols-outlined text-[20px]">add</span>
               <span>Create New Blog</span>
             </button>
          </Link>
        </div>
      </header>

      {/* Blog Grid (Asymmetric Bento-ish Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
        
        {blogs.length === 0 ? (
          <article className="lg:col-span-12 group border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center p-16 transition-all hover:border-[#d2bbff]/20 hover:bg-[#d2bbff]/5 w-full">
            <div className="w-20 h-20 rounded-full bg-[#202020] flex items-center justify-center text-[#d2bbff] mb-6 shadow-inner">
               <span className="material-symbols-outlined text-4xl">article</span>
            </div>
            <h3 className="text-xl font-bold text-[#e5e2e1]">Empty Editorial segment</h3>
            <p className="text-[#958da1] text-sm mt-3 text-center max-w-sm">Start writing your first technical narrative!</p>
          </article>
        ) : blogs.map((blog, idx) => {
          
          if (idx === 0) {
            // Primary Featured Card
            return (
              <article key={blog.id} className="lg:col-span-8 group relative bg-[#1b1b1c] rounded-2xl overflow-hidden transition-all duration-500 hover:bg-[#202020] border border-white/5 shadow-lg">
                <div className="flex flex-col md:flex-row h-full">
                  <div className="md:w-1/2 relative h-64 md:h-auto overflow-hidden">
                    <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={blog.coverImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuAATneqEWuD_d2YEjg496cOkpm9RqnbGB5MbLsnOwUbhQD2RP1csqnQCtV1VHEWDBuyNCvnsGWB5oNiV0KLNZpekwnX6IbPCnMN9AeFllzFvJeYpewCR1GJjeC0naVLLyDOj2xItM2x1EM4oL6up-ewDIfRXthAf_a4vuiYPj9CWwb36_e56G4bk1i-R9qUNXc_xOgWY19-JDjWKxd34C4hvkay-eMxaCTvFg12VgcPfJ4Wm9kjMgZLqQ4CVHbwcbyG6RgS0lj43QoK"} alt={blog.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      {blog.published ? (
                        <span className="bg-[#7c3aed]/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#7c3aed]/50">Published</span>
                      ) : (
                        <span className="bg-[#1b1b1c]/80 backdrop-blur-md text-[#958da1] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">Draft</span>
                      )}
                    </div>
                  </div>
                  <div className="md:w-1/2 p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-4 text-[#958da1] text-[10px] uppercase tracking-widest mb-4">
                        <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                        <span>{blog.readTime || 5} min read</span>
                      </div>
                      <h2 className="text-3xl font-bold tracking-tight text-[#e5e2e1] mb-4 leading-tight group-hover:text-[#d2bbff] transition-colors line-clamp-3">{blog.title}</h2>
                      <p className="text-[#ccc3d8] text-sm leading-relaxed mb-6 line-clamp-3">{blog.excerpt || "Click to read more..."}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      <Link href={`/blogs/${blog.slug}/edit`}>
                        <button className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#0e0e0e] text-[#ccc3d8] hover:text-white hover:bg-[#353535] transition-all border border-white/5">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                      </Link>
                      {blog.published && (
                        <Link href={`/blogs/${blog.slug}`}>
                          <button className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#0e0e0e] text-[#ccc3d8] hover:text-white hover:bg-[#353535] transition-all border border-white/5">
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>
                        </Link>
                      )}
                      <BlogDeleteButton blogId={blog.id} slug={blog.slug} />
                    </div>
                  </div>
                </div>
              </article>
            )
          }

          // Smaller Card Logic
          return (
            <article key={blog.id} className="lg:col-span-4 group bg-[#1b1b1c] rounded-2xl overflow-hidden transition-all duration-500 hover:bg-[#202020] border border-white/5 shadow-lg flex flex-col">
              <div className="h-48 relative shrink-0">
                <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={blog.coverImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuDANTDki4gjWoIi9TYDcu1zyP0qJhVHzO7YlAHknuYO-hjCN1i_jRPioHeNVbngGYQnDDlQ47FUPXBjIv3-Npi0yrDsZDMKIXs9u5vt0aBEYjFniTaTsXhNoJspv7NOpN6QqT2rLHE7kbbXO7775hWkXl7ba1JN6bxtJeO1_0e9m71SLukqQcGNmFKf20ImWLVP1YB7OJ9urz6SBVT0hyL89jMe0mrU479hXnxn1ojsIwt9VjJ81oiHKikVDMTKlaeeW1SZWAcn735R"} alt={blog.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-4 left-4">
                  {blog.published ? (
                    <span className="bg-[#7c3aed]/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#7c3aed]/50">Published</span>
                  ) : (
                    <span className="bg-[#1b1b1c]/80 backdrop-blur-md text-[#958da1] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">Draft</span>
                  )}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-4 text-[#958da1] text-[10px] uppercase tracking-widest mb-3">
                  <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                  <span>{blog.readTime || 5} min read</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-[#e5e2e1] mb-6 group-hover:text-[#d2bbff] transition-colors line-clamp-2">{blog.title}</h2>
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                  <span className="text-xs text-[#958da1]">{(blog.views / 1000).toFixed(blog.views > 1000 ? 1 : 0)}{blog.views > 1000 ? 'k' : ''} Views</span>
                  <div className="flex gap-1 items-center">
                    <Link href={`/blogs/${blog.slug}/edit`}>
                      <button className="p-2 text-[#ccc3d8] hover:text-white transition-colors rounded-lg hover:bg-white/5">
                        <span className="material-symbols-outlined text-sm align-middle">edit</span>
                      </button>
                    </Link>
                    {blog.published && (
                      <Link href={`/blogs/${blog.slug}`}>
                        <button className="p-2 text-[#ccc3d8] hover:text-white transition-colors rounded-lg hover:bg-white/5">
                          <span className="material-symbols-outlined text-sm align-middle">visibility</span>
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )
        })}

        {/* Grid Item Action Card (Appended to the grid) */}
        {blogs.length > 0 && (
          <Link href="/blogs/new" className="lg:col-span-4 w-full h-full flex block">
            <article className="group border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center p-8 transition-all hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/5 cursor-pointer flex-1 w-full min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-[#1b1b1c] flex items-center justify-center text-[#d2bbff] mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">post_add</span>
              </div>
              <h3 className="text-lg font-bold text-[#e5e2e1]">New Blog Post</h3>
              <p className="text-[#958da1] text-sm mt-2 text-center">Ready to share your next big insight? Start writing now.</p>
            </article>
          </Link>
        )}
      </div>
    </div>
  )
}
