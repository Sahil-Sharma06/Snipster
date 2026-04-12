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

  const languageLabel = snippet.language.toUpperCase()
  const createdLabel = new Date(snippet.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
  const updatedLabel = formatDistanceToNow(new Date(snippet.updatedAt), { addSuffix: true })
  const byteSizeKb = (new Blob([snippet.code]).size / 1024).toFixed(2)
  const lineCount = snippet.code.split("\n").length
  const fileExtension =
    snippet.language === "javascript"
      ? "js"
      : snippet.language === "typescript"
      ? "ts"
      : snippet.language === "python"
      ? "py"
      : snippet.language === "java"
      ? "java"
      : snippet.language === "go"
      ? "go"
      : snippet.language === "rust"
      ? "rs"
      : snippet.language === "csharp"
      ? "cs"
      : snippet.language === "cpp"
      ? "cpp"
      : snippet.language

  return (
    <div className="font-body antialiased -mt-8 md:-mt-10 bg-[#0a0a0a] text-[#e5e2e1]">
      <ViewTracker endpoint={`/api/snippets/${snippet.id}/view`} />

      <div className="relative pointer-events-none inset-0 -z-10">
        <div className="absolute -top-24 left-1/3 h-96 w-96 rounded-full bg-[#c0c1ff]/12 blur-[110px]" />
        <div className="absolute top-1/3 -right-16 h-72 w-72 rounded-full bg-[#8083ff]/10 blur-[96px]" />
      </div>

      <main className="w-full max-w-375 mx-auto px-4 md:px-8 pb-16">
        <header className="mb-10">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-surface-container-high text-primary text-[10px] font-bold tracking-widest uppercase rounded">
                  {languageLabel}
                </span>
                <span className="text-on-surface-variant text-xs">Created {createdLabel}</span>
              </div>

              <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                {snippet.title}
              </h1>

              <div className="flex items-center gap-3 pt-1">
                <img
                  className="w-8 h-8 rounded-full border border-outline-variant/30 object-cover"
                  src={snippet.author.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCVAXjNSRTuuxwFMmp6MAn1mSrUOrRdMWC9f9k1PipbnAtwNRPL-wQuViWnbKi5QJIF4vhZL7_QbNJYtpFkuBLg6JoZGF_-2HZJXaSV9I2L2tPcmqrbS0HmRZ-tJPoHu95pJl-x7Wo9xwWaXwcOHeXRDUwm8yIRm0tffKqnRAX_8o5i-3j6sXb4NI_QCaGsy8NVndhj-FdNxEMdGj0_4kbC6Z_b2OwfK1FlxhOJf94qlYT15JH-vks5OgoF0N81lNZfZEAqIXjJgf-X"}
                  alt={snippet.author.name || snippet.author.username || "Author"}
                />
                <div>
                  <Link href={`/profile/${snippet.author.username || snippet.author.id}`} className="text-sm font-medium text-white hover:text-primary transition-colors">
                    {snippet.author.name || snippet.author.username}
                  </Link>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Snippet Architect</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/10 w-fit">
              <LikeButton snippetId={snippet.id} initialLiked={hasLiked} initialCount={snippet._count.likes} />
              <ForkButton snippetId={snippet.id} isLoggedIn={!!currentUserData} isAuthor={isAuthor} />
              <BookmarkButton snippetId={snippet.id} initialBookmarked={hasBookmarked} initialCount={snippet._count.bookmarks} />
              {isAuthor && (
                <Link href={`/snippets/${snippet.id}/edit`}>
                  <button className="px-4 py-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant hover:text-white text-xs font-semibold uppercase tracking-wider">
                    Edit
                  </button>
                </Link>
              )}
            </div>
          </div>
        </header>

        <section className="relative mb-12">
          <div className="absolute -top-4 left-6 z-10 px-4 py-1.5 bg-surface-container-lowest border border-outline-variant/20 rounded-t-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-error" />
            <span className="w-2 h-2 rounded-full bg-tertiary" />
            <span className="w-2 h-2 rounded-full bg-primary-container" />
            <span className="ml-4 text-[10px] font-mono text-on-surface-variant/60 tracking-widest uppercase">main.{fileExtension}</span>
          </div>

          <div className="w-full bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10">
            <div className="flex justify-between items-center px-6 py-4 bg-surface-container-low/30 border-b border-outline-variant/10">
              <div className="flex gap-4">
                <button className="text-[10px] font-bold text-primary uppercase tracking-widest">Main</button>
              </div>
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{lineCount} lines</div>
            </div>

            <div className="p-6">
              <CodeBlock
                code={snippet.code}
                language={snippet.language}
                className="w-full [&>pre]:bg-transparent! [&>div>button]:bg-surface-container-high [&>div>button]:hover:bg-surface-container-highest"
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-12">
            <section>
              <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-3">
                Description <span className="h-px flex-1 bg-outline-variant/20" />
              </h2>
              {snippet.description ? (
                <div className="text-on-surface-variant leading-relaxed text-sm bg-surface-container-low p-5 border border-outline-variant/10 rounded-xl">
                  {snippet.description}
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">No description provided for this snippet.</p>
              )}
            </section>

            <section>
              <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-6 flex items-center gap-3">
                Community Discussions ({snippet._count.comments}) <span className="h-px flex-1 bg-outline-variant/20" />
              </h2>
              <CommentSection snippetId={snippet.id} currentUserId={currentUserData?.id || null} initialCount={snippet._count.comments} />
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
              <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-5">Code Architect</h3>
              <Link href={`/profile/${snippet.author.username || snippet.author.id}`} className="flex items-center gap-3 mb-5">
                <img
                  src={snippet.author.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCVAXjNSRTuuxwFMmp6MAn1mSrUOrRdMWC9f9k1PipbnAtwNRPL-wQuViWnbKi5QJIF4vhZL7_QbNJYtpFkuBLg6JoZGF_-2HZJXaSV9I2L2tPcmqrbS0HmRZ-tJPoHu95pJl-x7Wo9xwWaXwcOHeXRDUwm8yIRm0tffKqnRAX_8o5i-3j6sXb4NI_QCaGsy8NVndhj-FdNxEMdGj0_4kbC6Z_b2OwfK1FlxhOJf94qlYT15JH-vks5OgoF0N81lNZfZEAqIXjJgf-X"}
                  className="w-10 h-10 rounded-full object-cover border border-outline-variant/30"
                  alt={snippet.author.name || snippet.author.username || "Author"}
                />
                <div>
                  <p className="text-sm font-bold text-white">{snippet.author.name || snippet.author.username}</p>
                  <p className="text-[10px] text-on-surface-variant">@{snippet.author.username || "user"}</p>
                </div>
              </Link>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-surface-container-highest/20 rounded-xl border border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant uppercase mb-1">Followers</p>
                  <p className="text-lg font-bold text-white tracking-tight">{snippet.author._count.followers}</p>
                </div>
                <div className="p-3 bg-surface-container-highest/20 rounded-xl border border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant uppercase mb-1">Snippets</p>
                  <p className="text-lg font-bold text-white tracking-tight">{snippet.author._count.snippets}</p>
                </div>
              </div>

              {!isAuthor && (
                <FollowButton targetUserId={snippet.authorId} initialFollowing={!!isFollowing} isLoggedIn={!!currentUserData} />
              )}
            </section>

            <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
              <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-5">System Activity</h3>
              <div className="space-y-5">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">cloud_done</span>
                  <div>
                    <p className="text-[11px] font-bold text-on-surface uppercase tracking-tight">Snippet Active</p>
                    <p className="text-[10px] text-on-surface-variant/70">Updated {updatedLabel}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-tertiary text-lg">visibility</span>
                  <div>
                    <p className="text-[11px] font-bold text-on-surface uppercase tracking-tight">Visibility</p>
                    <p className="text-[10px] text-on-surface-variant/70">{snippet.isPublic ? "Public access enabled" : "Private snippet"}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant/70 text-lg">history</span>
                  <div>
                    <p className="text-[11px] font-bold text-on-surface uppercase tracking-tight">Initialized</p>
                    <p className="text-[10px] text-on-surface-variant/70">{formatDistanceToNow(new Date(snippet.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6 px-1">
              <div>
                <h4 className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em] mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {snippet.tags.length === 0 ? (
                    <span className="text-xs text-on-surface-variant">No tags</span>
                  ) : (
                    snippet.tags.map((tag) => (
                      <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="px-2 py-1 bg-surface-container-highest/40 rounded text-[10px] text-on-surface font-mono hover:text-primary transition-colors">
                        #{tag}
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-[0.2em] mb-3">Statistics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-surface-container-highest/20 rounded-xl border border-outline-variant/5">
                    <p className="text-[10px] text-on-surface-variant uppercase mb-1">Global Views</p>
                    <p className="text-xl font-bold text-white tracking-tight">{snippet.views.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-surface-container-highest/20 rounded-xl border border-outline-variant/5">
                    <p className="text-[10px] text-on-surface-variant uppercase mb-1">Byte Size</p>
                    <p className="text-xl font-bold text-white tracking-tight">{byteSizeKb}kb</p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
