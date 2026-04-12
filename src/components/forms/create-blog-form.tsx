"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, Plus, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { RichTextEditor } from "@/components/shared/rich-text-editor"
import { ImageUpload } from "@/components/shared/image-upload"
import Link from "next/link"

export function CreateBlogForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [published, setPublished] = useState(true)

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed])
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    if (!content.trim()) {
      toast.error("Content is required")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim() || undefined,
          content: content.trim(),
          coverImage: coverImage.trim() || undefined,
          tags,
          published,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create blog post")
      }

      const blog = await res.json()
      toast.success(published ? "Blog post published!" : "Draft saved!")
      router.push(`/blogs/${blog.slug}`)
      router.refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create blog post"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 font-body">
      <div className="flex items-center gap-3 text-on-surface-variant">
        <ArrowLeft className="h-4 w-4" />
        <Link href="/my-blogs" className="text-xs uppercase tracking-widest font-semibold hover:text-white transition-colors">
          Back to Collection
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-white mb-2">Create New Blog</h1>
        <p className="text-on-surface-variant max-w-xl text-sm md:text-base">
          Craft a new technical post with clean structure, context, and reusable insights.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-surface-container-low p-8 rounded-xl border-t border-surface-bright/20">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] uppercase tracking-widest text-primary font-bold">Post Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Engineering Reliable Webhook Pipelines"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 bg-surface-container-lowest border-none rounded-lg text-lg placeholder:text-on-surface-variant/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt" className="text-[10px] uppercase tracking-widest text-primary font-bold">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="A short description of your post..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  className="bg-surface-container-lowest border-none rounded-lg text-sm placeholder:text-on-surface-variant/30 resize-none"
                />
                <p className="text-xs text-on-surface-variant/60">{excerpt.length}/500 characters</p>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 bg-surface-container-high/50 border-b border-outline-variant/5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-error/40" />
                <span className="w-3 h-3 rounded-full bg-tertiary/40" />
                <span className="w-3 h-3 rounded-full bg-primary/40" />
                <span className="ml-4 text-[10px] uppercase tracking-widest font-mono text-on-surface-variant/60">editor.v2</span>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-2">
                <Label htmlFor="content" className="text-[10px] uppercase tracking-widest text-primary font-bold">Content</Label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Write your blog post content..."
                  disabled={isSubmitting}
                />
                <p className="text-xs text-on-surface-variant/60">Use headings, lists, code blocks, and links for technical clarity.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <section className="bg-surface-container p-8 rounded-xl border border-outline-variant/10">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white mb-8">Publishing Configuration</h3>

            <div className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="coverImage" className="text-[10px] uppercase tracking-widest text-primary font-bold">Cover Image</Label>
                <ImageUpload
                  value={coverImage}
                  onChange={setCoverImage}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-on-surface-variant/60">Upload a cover image (max 4MB)</p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="tags" className="text-[10px] uppercase tracking-widest text-primary font-bold">Classification Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    disabled={isSubmitting || tags.length >= 10}
                    className="h-10 bg-surface-container-lowest border-none rounded-lg text-sm"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={addTag}
                    disabled={isSubmitting || !tagInput.trim() || tags.length >= 10}
                    className="h-10 w-10 border-outline-variant/30"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <Badge key={tag} className="px-2 py-1 bg-surface-container-lowest text-primary text-[10px] font-mono border border-primary/20 rounded gap-1">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 opacity-70 hover:opacity-100"
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[10px] text-on-surface-variant">No tags yet</span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant/60">{tags.length}/10 tags</p>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] uppercase tracking-widest text-primary font-bold">Privacy Level</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPublished(true)}
                    disabled={isSubmitting}
                    className={`py-4 rounded-lg flex flex-col items-center gap-2 transition-all border-2 ${published ? "bg-[#201f1f] border-primary text-white" : "bg-surface-container-lowest border-transparent text-on-surface-variant"}`}
                  >
                    <span className="material-symbols-outlined text-xl">public</span>
                    <span className="text-[10px] font-bold tracking-widest uppercase">Publish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublished(false)}
                    disabled={isSubmitting}
                    className={`py-4 rounded-lg flex flex-col items-center gap-2 transition-all border-2 ${!published ? "bg-[#201f1f] border-primary text-white" : "bg-surface-container-lowest border-transparent text-on-surface-variant"}`}
                  >
                    <span className="material-symbols-outlined text-xl">draft</span>
                    <span className="text-[10px] font-bold tracking-widest uppercase">Draft</span>
                  </button>
                </div>
                <div className="hidden">
                  <Checkbox
                    id="published"
                    checked={published}
                    onCheckedChange={(checked) => setPublished(checked === true)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 beam-button text-white! hover:text-white! focus-visible:text-white! disabled:text-white/80 disabled:opacity-100 font-black text-sm tracking-[0.2em] uppercase rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="relative z-1 text-white">{published ? "Publishing" : "Saving"}</span>
                </>
              ) : (
                <span className="relative z-1 text-white">{published ? "Publish Post" : "Save Draft"}</span>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => toast.info("Draft saved locally")}
                disabled={isSubmitting}
                className="h-11 border-outline-variant/30 text-on-surface-variant font-bold text-[10px] tracking-widest uppercase hover:bg-surface-bright/10"
              >
                Save Draft
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="h-11 text-error/70 hover:text-error font-bold text-[10px] tracking-widest uppercase"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
