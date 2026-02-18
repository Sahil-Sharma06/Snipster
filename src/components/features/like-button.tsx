"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface LikeButtonProps {
  snippetId?: string
  blogId?: string
  initialLiked: boolean
  initialCount: number
}

export function LikeButton({
  snippetId,
  blogId,
  initialLiked,
  initialCount,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    const prevLiked = liked
    const prevCount = count

    setLiked(!liked)
    setCount(liked ? count - 1 : count + 1)

    try {
      const endpoint = snippetId
        ? `/api/snippets/${snippetId}/like`
        : blogId
        ? `/api/blogs/${blogId}/like`
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
      setLiked(data.liked)
      setCount(data.count)
    } catch {
      setLiked(prevLiked)
      setCount(prevCount)
      toast.error("Failed to update like")
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
        "gap-1.5 text-muted-foreground hover:text-rose-500",
        liked && "text-rose-500"
      )}
    >
      <Heart
        className={cn("h-4 w-4", liked && "fill-current")}
      />
      <span className="text-sm">{count}</span>
    </Button>
  )
}
