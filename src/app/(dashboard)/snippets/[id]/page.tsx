import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { CodeBlock } from "@/components/shared/code-block"
import { ViewTracker } from "@/components/shared/view-tracker"
import { getCurrentUser } from "@/lib/auth/current-user"
import { LikeButton } from "@/components/features/like-button"
import { BookmarkButton } from "@/components/features/bookmark-button"
import { ForkButton } from "@/components/features/fork-button"
import { CommentSection } from "@/components/features/comment-section"
import { FollowButton } from "@/components/features/follow-button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

interface SnippetPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: SnippetPageProps) {
  const { id } = await params
  const snippet = await prisma.snippet.findUnique({
    where: { id },
    select: { title: true, description: true, language: true, author: { select: { name: true, username: true } } },
  })
  if (!snippet) return { title: "Snippet not found" }
  const author = snippet.author.name || snippet.author.username || "Unknown"
  return {
    title: `${snippet.title} — ${snippet.language} snippet by ${author} | Snipster`,
    description: snippet.description || `A ${snippet.language} code snippet by ${author} on Snipster`,
    openGraph: {
      title: snippet.title,
      description: snippet.description || `A ${snippet.language} snippet by ${author}`,
    },
  }
}

export default async function SnippetPage({ params }: SnippetPageProps) {
  const { id } = await params
  const currentUserData = await getCurrentUser()

  const snippet = await prisma.snippet.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          _count: {
            select: {
              snippets: { where: { isPublic: true } },
              followers: true,
            },
          },
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          bookmarks: true,
        },
      },
    },
  })

  if (!snippet) notFound()

  const isAuthor = currentUserData?.id === snippet.authorId

  const [like, bookmark, isFollowing] = await Promise.all([
    currentUserData
      ? prisma.like.findUnique({ where: { userId_snippetId: { userId: currentUserData.id, snippetId: snippet.id } } })
      : null,
    currentUserData
      ? prisma.bookmark.findUnique({ where: { userId_snippetId: { userId: currentUserData.id, snippetId: snippet.id } } })
      : null,
    currentUserData && !isAuthor
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: currentUserData.id, followingId: snippet.authorId } },
        }).then(Boolean)
      : Promise.resolve(false),
  ])

  const hasLiked = !!like
  const hasBookmarked = !!bookmark

  return (
    <div className="font-['Inter'] antialiased md:-ml-4 lg:-ml-6 -mt-6">
      <ViewTracker endpoint={`/api/snippets/${snippet.id}/view`} />

      <div className="flex flex-col h-[calc(100vh-64px)] max-h-screen bg-[#131313]">
        {/* Editor Sub-Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between px-8 py-6 gap-4 border-b border-white/5 bg-[#1b1b1c]/80 backdrop-blur-md">
          <div className="space-y-1">
            <nav className="flex items-center text-[10px] uppercase tracking-widest text-[#958da1] gap-2 mb-2">
              <Link href={`/profile/${snippet.author.username || snippet.author.id}`} className="hover:text-[#d2bbff] transition-colors">{snippet.author.name || snippet.author.username}</Link>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="text-[#ccc3d8]">Snippet Collection</span>
            </nav>
            <h1 className="text-3xl font-extrabold tracking-tighter text-[#e5e2e1] lg:w-[600px] truncate">{snippet.title}</h1>
          </div>
          <div className="flex items-center gap-4">
             {isAuthor && (
               <Link href={`/snippets/${snippet.id}/edit`}>
                 <button className="px-5 py-2 text-xs font-semibold text-[#ccc3d8] hover:text-white transition-colors bg-[#2a2a2a] rounded-full">Edit Snippet</button>
               </Link>
             )}
             <div className="flex bg-[#0e0e0e] rounded-full p-1 border border-white/5">
                <LikeButton snippetId={snippet.id} initialLiked={hasLiked} initialCount={snippet._count.likes} />
                <BookmarkButton snippetId={snippet.id} initialBookmarked={hasBookmarked} initialCount={snippet._count.bookmarks} />
                <ForkButton snippetId={snippet.id} isLoggedIn={!!currentUserData} isAuthor={isAuthor} />
             </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden flex-col lg:flex-row bg-[#1b1b1c]">
          {/* Editor Core Section (Left) */}
          <div className="flex-1 relative bg-[#0e0e0e] lg:ml-8 lg:mb-8 rounded-tr-2xl lg:rounded-tr-none lg:rounded-tl-2xl overflow-hidden border-l border-t border-white/5 flex flex-col">
            {/* Tab Bar */}
            <div className="flex items-center bg-[#131313]/50 border-b border-white/5 px-4 py-2 gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-[#2a2a2a] rounded-lg border border-white/10 group cursor-default">
                <span className="material-symbols-outlined text-blue-400 text-sm">code</span>
                <span className="text-xs font-medium text-[#ccc3d8]">main.{snippet.language === 'javascript' ? 'js' : snippet.language === 'python' ? 'py' : snippet.language}{(snippet.language === 'typescript' || snippet.language === 'react' || snippet.language === 'nextjs') ? 'ts' : ''}</span>
                <span className="w-2 h-2 rounded-full bg-[#d2bbff] ml-2"></span>
              </div>
            </div>

            {/* Code Canvas & Comments */}
            <div className="flex-1 overflow-auto custom-scrollbar flex flex-col">
              <div className="flex-1 p-6 relative">
                 <CodeBlock code={snippet.code} language={snippet.language} className="w-full bg-transparent shadow-none [&>pre]:!bg-transparent text-sm font-mono [&>div>button]:bg-[#2a2a2a] [&>div>button]:hover:bg-[#353535] [&>div]:!m-0" />
                 {/* Flashing cursor simulation at bottom of code */}
                 <div className="mt-2 text-xs font-mono pl-12"><div className="cursor-beam h-5 w-[2px] bg-[#d2bbff] animate-pulse inline-block align-middle"></div></div>
              </div>
              
              {/* Description & Comments Section embedded below code block like a terminal output */}
              <div className="border-t border-white/5 bg-[#131313] p-8">
                 {snippet.description && (
                   <div className="mb-8 p-4 bg-[#1b1b1c] rounded-xl border border-white/5">
                     <p className="text-xs text-[#958da1] uppercase font-bold tracking-widest mb-2">Description</p>
                     <p className="text-[#ccc3d8] leading-relaxed text-sm">{snippet.description}</p>
                   </div>
                 )}
                 <h4 className="text-sm font-bold text-[#e5e2e1] mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-sm">chat_bubble</span> Discusssion Engine ({snippet._count.comments})</h4>
                 <CommentSection snippetId={snippet.id} currentUserId={currentUserData?.id || null} initialCount={snippet._count.comments} />
              </div>
            </div>
          </div>

          {/* Editor Right Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col border-t lg:border-t-0 lg:border-l border-white/5 bg-[#131313] px-6 py-8 gap-8 overflow-y-auto custom-scrollbar z-10">
            {/* Author Profile */}
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#958da1]">Code Architect</label>
              <div className="bg-[#1b1b1c] rounded-xl p-4 border border-white/5 hover:bg-[#202020] transition-colors">
                <Link href={`/profile/${snippet.author.username || snippet.author.id}`} className="flex items-center gap-3">
                   <img src={snippet.author.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCVAXjNSRTuuxwFMmp6MAn1mSrUOrRdMWC9f9k1PipbnAtwNRPL-wQuViWnbKi5QJIF4vhZL7_QbNJYtpFkuBLg6JoZGF_-2HZJXaSV9I2L2tPcmqrbS0HmRZ-tJPoHu95pJl-x7Wo9xwWaXwcOHeXRDUwm8yIRm0tffKqnRAX_8o5i-3j6sXb4NI_QCaGsy8NVndhj-FdNxEMdGj0_4kbC6Z_b2OwfK1FlxhOJf94qlYT15JH-vks5OgoF0N81lNZfZEAqIXjJgf-X"} className="w-10 h-10 rounded-full object-cover border border-[#4a4455]" alt="Author" />
                   <div>
                     <p className="text-sm font-bold text-[#e5e2e1]">{snippet.author.name || snippet.author.username}</p>
                     <p className="text-[10px] text-[#958da1]">@{snippet.author.username}</p>
                   </div>
                </Link>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#d2bbff]">{snippet.author._count.followers}</p>
                    <p className="text-[9px] uppercase tracking-widest text-[#958da1]">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#d2bbff]">{snippet.author._count.snippets}</p>
                    <p className="text-[9px] uppercase tracking-widest text-[#958da1]">Snippets</p>
                  </div>
                </div>
                {!isAuthor && (
                   <div className="mt-4">
                     <FollowButton targetUserId={snippet.authorId} initialFollowing={!!isFollowing} isLoggedIn={!!currentUserData} />
                   </div>
                )}
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#958da1]">Environment</label>
              <div className="relative group">
                <div className="w-full bg-[#1b1b1c] rounded-xl px-4 py-3 border border-white/5 flex items-center justify-between cursor-default">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-400" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                    <span className="text-sm font-medium capitalize text-[#e5e2e1]">{snippet.language}</span>
                  </div>
                  <span className="material-symbols-outlined text-[#958da1]">settings_ethernet</span>
                </div>
              </div>
            </div>

            {/* Validation */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#958da1]">Access Layer</label>
              <div className="bg-[#1b1b1c] p-1 rounded-full border border-white/5 relative flex overflow-hidden">
                 <div className={`flex-1 py-1.5 text-[11px] font-bold rounded-full text-center transition-all ${snippet.isPublic ? 'bg-[#7c3aed] text-white shadow-lg' : 'text-[#958da1]'}`}>PUBLIC</div>
                 <div className={`flex-1 py-1.5 text-[11px] font-bold rounded-full text-center transition-all ${!snippet.isPublic ? 'bg-[#93000a] text-white shadow-lg' : 'text-[#958da1]'}`}>PRIVATE</div>
              </div>
            </div>

            {/* Tags Pills */}
            <div className="space-y-3">
               <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#958da1]">Taxonomy Nodes</label>
               <div className="flex flex-wrap gap-2">
                 {snippet.tags.length === 0 ? (
                   <span className="text-xs italic text-[#958da1]">No nodes assigned</span>
                 ) : snippet.tags.map(tag => (
                    <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
                       <span className="bg-[#7c3aed]/10 text-[#d2bbff] hover:bg-[#7c3aed]/20 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold border border-[#7c3aed]/20 transition-colors">
                           {tag}
                       </span>
                    </Link>
                 ))}
               </div>
            </div>

            {/* Stats / Metadata */}
            <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#958da1] font-bold uppercase tracking-widest">Global Views</span>
                  <span className="text-[#e5e2e1] font-mono font-bold animate-pulse">{snippet.views.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#958da1] font-bold uppercase tracking-widest">Initialization</span>
                  <span className="text-[#e5e2e1] font-medium">{formatDistanceToNow(new Date(snippet.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#958da1] font-bold uppercase tracking-widest">Byte Size</span>
                  <span className="text-[#d2bbff] font-mono">{(new Blob([snippet.code]).size / 1024).toFixed(2)} kb</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
