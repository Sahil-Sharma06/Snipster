import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import Link from "next/link"

interface ProfilePageProps {
  searchParams: Promise<{ tab?: string }>
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

  const [snippets, blogs, collections] = await Promise.all([
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
  ])

  const githubUsername = fullUser.githubUrl 
    ? fullUser.githubUrl.replace(/\/$/, '').split('/').pop() 
    : ""

  return (
    <div className="-mt-6 -mx-4 md:-mx-6 font-['Inter'] antialiased">
      {/* Profile Banner */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden border-b border-white/5">
        <img 
          className="w-full h-full object-cover opacity-60" 
          alt="Cover Image" 
          src={(fullUser as any).coverImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuDXX_CWgbITi_POZ7dWSaGZslmiimfF7801kAyRkmuMpbXgWKtm3E9hTcbRWYvwLzrlRg_o8eLzZUvqvUTCcdSxSbUE3nBwgPDk1RA7UZF37HEW-Sm2PZrgoB5jj1WkFlHkXBnUaKr_BMWe5W_H-VMp83FCXkU6nL7YcznCV9MCWGhh9u7q79kKP3ixZqkX3jpDSOFc8xdQn41Dg3N_2I6sbGQQg3JmbTPqPc2tBwLE4FGHJOLQA9DqGdK_1vBgD8iOPrKCUUX1By1J"} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent"></div>
      </div>

      {/* Profile Header Section */}
      <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-10">
        <div className="flex flex-col md:flex-row items-end gap-6 md:gap-8">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-[6px] border-[#131313] overflow-hidden bg-surface-container shadow-2xl">
              <img 
                className="w-full h-full object-cover" 
                alt="Profile photo" 
                src={fullUser.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCJJAiyHaikYCOJuSB-dI-ScxLxao9gsa7n7vHIcXvZgAuO0_bQ8flT1WCyOh-wa-XqvD2upE1nU_h5GeQzXplbZ4jdbKsizzWmwnooxX8bJ_LkiDs4wb2dxAUy4u5YTj3heqTKEdamUdHfsWsGfl_TmHM-8Lu-wX6KL0xfWsAtNDJGSok9oYwR2mc1OUlsCHpn8gcoTzTzYzPWlrBlRWKqf_uGQjn10oJJQOb6dc7lfO3mQbKv35hNUUp7TMtvIo0etZ5UHmaQ2wGX"} 
              />
            </div>
            <Link href="/profile/edit" className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
            </Link>
          </div>

          {/* Basic Info & Actions */}
          <div className="flex-1 pb-2 flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
            <div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-on-surface">{fullUser.name || fullUser.username}</h2>
              <p className="text-primary font-mono text-lg tracking-tight">@{fullUser.username}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/profile/edit" className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 px-6 py-2.5 rounded-xl font-bold text-sm transition-all text-on-surface">
                Edit Profile
              </Link>
              <button className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary-container/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>share</span> Share
              </button>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12 mb-20 text-[#e5e2e1]">
          {/* Left Column: Bio & Meta */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#1b1b1c] p-6 rounded-[2rem] border border-[#4a4455]/10">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Biography</h3>
              <p className="text-[#ccc3d8] leading-relaxed">
                {fullUser.bio || (
                  <span className="italic text-zinc-600">No biography provided.</span>
                )}
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                {fullUser.githubUrl && (
                  <a href={fullUser.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">public</span> {githubUsername}
                  </a>
                )}
                {fullUser.twitterUrl && (
                  <a href={fullUser.twitterUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">link</span> Twitter
                  </a>
                )}
                {fullUser.websiteUrl && (
                  <a href={fullUser.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">public</span> Website
                  </a>
                )}
              </div>
            </div>

            {/* Activity Stats Bento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#202020] p-6 rounded-[2rem] border border-[#4a4455]/5 text-center">
                <p className="text-3xl font-black text-on-surface">{fullUser._count.snippets}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1">Snippets</p>
              </div>
              <div className="bg-[#202020] p-6 rounded-[2rem] border border-[#4a4455]/5 text-center">
                <p className="text-3xl font-black text-on-surface">{fullUser._count.collections}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1">Colls</p>
              </div>
              <div className="bg-[#202020] p-6 rounded-[2rem] border border-[#4a4455]/5 text-center">
                <p className="text-3xl font-black text-on-surface">{fullUser._count.blogs}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1">Articles</p>
              </div>
              <div className="bg-[#202020] p-6 rounded-[2rem] border border-[#4a4455]/5 text-center">
                <p className="text-3xl font-black text-on-surface">{fullUser._count.followers}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1">Followers</p>
              </div>
            </div>
          </div>

          {/* Right Column: Tabs & Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* GitHub Heatmap Block */}
            {githubUsername ? (
              <div className="bg-[#0e0e0e] p-8 rounded-[2rem] border border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">GitHub Pulse</h3>
                  <a href={fullUser.githubUrl!} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline">
                    github.com/{githubUsername}
                  </a>
                </div>
                <div className="w-full overflow-x-auto hide-scrollbar scrollbar-hide flex justify-center bg-black/20 p-4 rounded-xl border border-white/5">
                  <img 
                    src={`https://ghchart.rshah.org/A78BFA/${githubUsername}`} 
                    alt="Github chart" 
                    className="w-full min-w-[700px] h-[110px]" 
                  />
                </div>
              </div>
            ) : (
              <div className="bg-[#0e0e0e] p-8 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-[#1b1b1c] flex items-center justify-center mb-6 border border-white/5">
                  <span className="material-symbols-outlined text-4xl text-zinc-500">code</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Connect your GitHub</h3>
                <p className="text-sm text-zinc-500 mb-8 max-w-sm leading-relaxed">
                  Connect your GitHub account in settings to automatically display your contribution heatmap here.
                </p>
                <Link href="/profile/edit" className="bg-[#7c3aed] text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-lg hover:opacity-90 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">link</span> Setup GitHub
                </Link>
              </div>
            )}

            {/* Tabs Component (HTML Static but styled) */}
            <div className="border-b border-white/5 flex gap-8">
              <Link href="?tab=snippets" className={`pb-4 font-bold text-sm tracking-widest uppercase transition-colors ${tab === 'snippets' ? 'text-[#d2bbff] border-b-2 border-[#7c3aed]' : 'text-zinc-500 hover:text-zinc-300'}`}>Snippets</Link>
              <Link href="?tab=blogs" className={`pb-4 font-bold text-sm tracking-widest uppercase transition-colors ${tab === 'blogs' ? 'text-[#d2bbff] border-b-2 border-[#7c3aed]' : 'text-zinc-500 hover:text-zinc-300'}`}>Blogs</Link>
              <Link href="?tab=collections" className={`pb-4 font-bold text-sm tracking-widest uppercase transition-colors ${tab === 'collections' ? 'text-[#d2bbff] border-b-2 border-[#7c3aed]' : 'text-zinc-500 hover:text-zinc-300'}`}>Collections</Link>
            </div>

            {/* Asymmetric Content Grid (Show top 3 snippets dynamically!) */}
            {tab === "snippets" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!snippets.length ? (
                  <div className="col-span-full bg-[#202020] p-1 rounded-[2rem] border border-[#4a4455]/10 mt-2 text-center py-12">
                    <p className="text-zinc-500">No snippets yet.</p>
                  </div>
                ) : (
                  <>
                    {/* Card 1 */}
                    {snippets[0] && (
                      <Link href={`/snippets/${snippets[0].id}`} className="bg-[#202020] p-1 rounded-[2rem] group cursor-pointer border border-[#4a4455]/10">
                        <div className="bg-[#0e0e0e] rounded-[1.75rem] p-6 h-full flex flex-col relative overflow-hidden">
                          <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-bold text-[#d2bbff] border border-[#d2bbff]/20 px-2 py-1 rounded uppercase bg-[#d2bbff]/10">
                              {snippets[0].language}
                            </span>
                            <div className="flex gap-2">
                              <span className="text-xs font-mono text-zinc-500">{snippets[0].views} views</span>
                            </div>
                          </div>
                          <h4 className="text-lg font-bold text-on-surface mb-2 leading-tight relative z-10">{snippets[0].title}</h4>
                          <p className="text-sm text-zinc-500 line-clamp-2 mb-4 relative z-10">{snippets[0].description || "No description provided."}</p>
                          <div className="mt-auto flex items-center justify-between text-[11px] font-mono text-zinc-500 uppercase tracking-tighter relative z-10">
                            <span>{new Date(snippets[0].updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </Link>
                    )}

                    {/* Card 2 (Large Vertical) */}
                    {snippets[1] && (
                      <Link href={`/snippets/${snippets[1].id}`} className="bg-[#202020] p-1 rounded-[2rem] group cursor-pointer border border-[#4a4455]/10 md:row-span-2 relative">
                        <div className="bg-[#0e0e0e] rounded-[1.75rem] p-6 h-full flex flex-col relative overflow-hidden">
                          <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-bold text-emerald-400 border border-emerald-400/20 px-2 py-1 rounded uppercase bg-emerald-400/10">
                              {snippets[1].language}
                            </span>
                          </div>
                          <h4 className="text-xl font-bold text-[#e5e2e1] mb-4 leading-tight relative z-10">{snippets[1].title}</h4>
                          
                          <div className="bg-[#1b1b1c] rounded-xl p-4 mb-6 font-mono text-xs text-zinc-400 overflow-hidden relative z-10 border border-white/5 shadow-inner">
                            <pre className="whitespace-pre"><code>{snippets[1].code.split('\n').slice(0, 4).join('\n')}...</code></pre>
                          </div>
                          
                          <p className="text-sm text-zinc-500 mb-6 leading-relaxed relative z-10">
                            {snippets[1].description}
                          </p>
                          
                          <div className="mt-auto flex items-center gap-4 relative z-10">
                            <div className="flex -space-x-2">
                              <img src={fullUser.image!} alt="" className="w-6 h-6 rounded-full border border-background" />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{snippets[1]._count.likes} Likes</span>
                          </div>
                        </div>
                      </Link>
                    )}

                    {/* Card 3 */}
                    {snippets[2] && (
                      <Link href={`/snippets/${snippets[2].id}`} className="bg-[#202020] p-1 rounded-[2rem] group cursor-pointer border border-[#4a4455]/10">
                        <div className="bg-[#0e0e0e] rounded-[1.75rem] p-6 h-full flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded">
                              {snippets[2].language}
                            </span>
                            <span className="material-symbols-outlined text-zinc-600 group-hover:text-primary transition-colors text-sm">bookmark</span>
                          </div>
                          <h4 className="text-lg font-bold text-[#e5e2e1] mb-2 leading-tight">{snippets[2].title}</h4>
                          <p className="text-sm text-zinc-500 line-clamp-2">{snippets[2].description}</p>
                        </div>
                      </Link>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* Blogs Tab Mapping */}
            {tab === "blogs" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!blogs.length ? (
                  <div className="col-span-full bg-[#202020] p-1 rounded-[2rem] border border-[#4a4455]/10 mt-2 text-center py-12">
                    <span className="material-symbols-outlined text-4xl text-zinc-600 mb-4">article</span>
                    <p className="text-zinc-500">No blogs written yet.</p>
                  </div>
                ) : (
                  blogs.map((blog) => (
                    <Link key={blog.id} href={`/blogs/${blog.slug}`} className="bg-[#202020] p-1 rounded-[2rem] group cursor-pointer border border-[#4a4455]/10">
                      <div className="bg-[#0e0e0e] rounded-[1.75rem] p-6 h-full flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-bold text-[#93000a] bg-[#ffdad6] border border-[#ffdad6]/20 px-2 py-1 rounded uppercase">
                            Article
                          </span>
                          <span className="text-xs font-mono text-zinc-500">{blog.views} views</span>
                        </div>
                        <h4 className="text-lg font-bold text-[#e5e2e1] mb-2 leading-tight">{blog.title}</h4>
                        <p className="text-sm text-zinc-500 line-clamp-2 mb-6">{blog.excerpt || "Click to read more..."}</p>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-tighter">
                            {new Date(blog.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-1 text-zinc-500">
                             <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                             <span className="text-xs font-bold">{blog._count.likes}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Collections Tab Mapping */}
            {tab === "collections" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!collections.length ? (
                  <div className="col-span-full bg-[#202020] p-1 rounded-[2rem] border border-[#4a4455]/10 mt-2 text-center py-12">
                    <span className="material-symbols-outlined text-4xl text-zinc-600 mb-4">auto_awesome_motion</span>
                    <p className="text-zinc-500">No collections created yet.</p>
                  </div>
                ) : (
                  collections.map((col) => (
                    <Link key={col.id} href={`/collections/${col.id}`} className="bg-[#202020] p-1 rounded-[2rem] group cursor-pointer border border-[#4a4455]/10">
                      <div className="bg-[#0e0e0e] rounded-[1.75rem] p-6 h-full flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-bold text-[#0566d9] bg-[#e6ecff] border border-[#e6ecff]/20 px-2 py-1 rounded uppercase">
                            Collection
                          </span>
                          {!col.isPublic && (
                             <span className="material-symbols-outlined text-zinc-600 text-sm">lock</span>
                          )}
                        </div>
                        <h4 className="text-lg font-bold text-[#e5e2e1] mb-2 leading-tight group-hover:text-[#d2bbff] transition-colors">{col.name}</h4>
                        <p className="text-sm text-zinc-500 line-clamp-2 mb-6">{col.description || "A custom collection of snippets."}</p>
                        <div className="mt-auto flex items-center gap-2 text-[11px] font-mono text-primary uppercase tracking-tighter">
                          <span className="material-symbols-outlined text-sm">code</span>
                          <span>{col._count.snippets} Snippets attached</span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
