"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface BookmarkButtonProps {
  snippetId?: string
  blogId?: string
  initialBookmarked: boolean
  initialCount: number
}

export function BookmarkButton({
  snippetId,
  blogId,
  initialBookmarked,
  initialCount,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    const prevBookmarked = bookmarked
    const prevCount = count

    setBookmarked(!bookmarked)
    setCount(bookmarked ? count - 1 : count + 1)

    try {
      const endpoint = snippetId
        ? `/api/snippets/${snippetId}/bookmark`
        : blogId
        ? `/api/blogs/${blogId}/bookmark`
        : ""

      if (!endpoint) {
        throw new Error("No ID provided")
      }

      const res = await fetch(endpoint, {
        method: "POST",
      })

      if (!res.ok) {
        throw new Error("Failed")
      }

      const data = await res.json()
      setBookmarked(data.bookmarked)
      setCount(data.count)
    } catch {
      setBookmarked(prevBookmarked)
      setCount(prevCount)
      toast.error("Failed to update bookmark")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "gap-1.5 text-muted-foreground hover:text-amber-500",
        bookmarked && "text-amber-500"
      )}
    >
      <Bookmark
        className={cn("h-4 w-4", bookmarked && "fill-current")}
      />
      <span className="text-sm">{count}</span>
    </Button>
  )
}
