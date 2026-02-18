"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Loader2, X, Plus } from "lucide-react"
import { toast } from "sonner"

export function CreateBlogForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [published, setPublished] = useState(false)

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Enter blog post title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          placeholder="A short description of your post (optional)"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          disabled={isSubmitting}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          {excerpt.length}/500 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverImage">Cover Image URL</Label>
        <Input
          id="coverImage"
          type="url"
          placeholder="https://example.com/image.jpg (optional)"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          placeholder="Write your blog post content... (Supports HTML)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          rows={16}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          You can use basic HTML tags for formatting
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
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
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={addTag}
            disabled={isSubmitting || !tagInput.trim() || tags.length >= 10}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                  disabled={isSubmitting}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {tags.length}/10 tags
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="published"
          checked={published}
          onCheckedChange={(checked) => setPublished(checked === true)}
          disabled={isSubmitting}
        />
        <Label htmlFor="published" className="font-normal">
          Publish immediately (uncheck to save as draft)
        </Label>
      </div>

      <Card className="p-4 bg-muted/50">
        <h3 className="text-sm font-medium mb-2">Preview</h3>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{title || "Untitled Post"}</h2>
          {excerpt && (
            <p className="text-sm text-muted-foreground">{excerpt}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {published ? "Publishing..." : "Saving..."}
            </>
          ) : (
            <>{published ? "Publish Post" : "Save Draft"}</>
          )}
        </Button>
      </div>
    </form>
  )
}
