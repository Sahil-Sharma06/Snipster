"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface FollowButtonProps {
  targetUserId: string
  initialFollowing: boolean
  isLoggedIn: boolean
}

export function FollowButton({
  targetUserId,
  initialFollowing,
  isLoggedIn,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = () => {
    if (!isLoggedIn) {
      router.push("/sign-in")
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/users/${targetUserId}/follow`, {
          method: "POST",
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          toast.error(data.error || "Something went wrong")
          return
        }
        const data = await res.json()
        setFollowing(data.following)
        toast.success(data.following ? "Following!" : "Unfollowed")
        router.refresh()
      } catch {
        toast.error("Failed to update follow status")
      }
    })
  }

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="shrink-0"
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : following ? (
        <UserMinus className="mr-2 h-4 w-4" />
      ) : (
        <UserPlus className="mr-2 h-4 w-4" />
      )}
      {following ? "Unfollow" : "Follow"}
    </Button>
  )
}
