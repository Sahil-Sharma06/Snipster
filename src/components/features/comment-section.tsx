"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Loader2, MessageCircle, Send, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
}

interface CommentSectionProps {
  snippetId?: string
  blogId?: string
  currentUserId: string | null
  initialCount: number
}

export function CommentSection({
  snippetId,
  blogId,
  currentUserId,
  initialCount,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()
  }, [snippetId, blogId])

  const fetchComments = async () => {
    try {
      const endpoint = snippetId
        ? `/api/snippets/${snippetId}/comments`
        : blogId
        ? `/api/blogs/${blogId}/comments`
        : ""

      if (!endpoint) return

      const res = await fetch(endpoint)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch {
      toast.error("Failed to load comments")
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)
    try {
      const endpoint = snippetId
        ? `/api/snippets/${snippetId}/comments`
        : blogId
        ? `/api/blogs/${blogId}/comments`
        : ""

      if (!endpoint) {
        throw new Error("No ID provided")
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to post comment")
      }

      const newComment = await res.json()
      setComments((prev) => [newComment, ...prev])
      setContent("")
      toast.success("Comment posted!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId)
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete")

      setComments((prev) => prev.filter((c) => c.id !== commentId))
      toast.success("Comment deleted")
    } catch {
      toast.error("Failed to delete comment")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h2 className="text-lg font-semibold">
          Comments ({comments.length || initialCount})
        </h2>
      </div>

      {currentUserId && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            disabled={isLoading}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !content.trim()}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Post Comment
            </Button>
          </div>
        </form>
      )}

      {isFetching ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user.image || ""} />
                  <AvatarFallback className="text-xs">
                    {comment.user.name?.charAt(0) ||
                      comment.user.username?.charAt(0) ||
                      "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.user.name || comment.user.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {currentUserId === comment.user.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                      >
                        {deletingId === comment.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
