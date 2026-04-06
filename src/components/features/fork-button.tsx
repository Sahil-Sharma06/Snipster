"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { GitFork, Loader2, Check } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ForkButtonProps {
  snippetId: string
  isLoggedIn: boolean
  isAuthor: boolean
}

export function ForkButton({ snippetId, isLoggedIn, isAuthor }: ForkButtonProps) {
  const [forked, setForked] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (isAuthor) return null

  const handleFork = () => {
    if (!isLoggedIn) {
      router.push("/sign-in")
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/snippets/${snippetId}/fork`, {
          method: "POST",
        })

        const data = await res.json()

        if (!res.ok) {
          toast.error(data.error || "Failed to fork snippet")
          return
        }

        setForked(true)
        toast.success("Snippet forked! Opening your copy...", {
          action: {
            label: "Edit it",
            onClick: () => router.push(`/snippets/${data.id}/edit`),
          },
        })
        // Navigate to the new snippet after a short delay
        setTimeout(() => {
          router.push(`/snippets/${data.id}/edit`)
        }, 1500)
      } catch {
        toast.error("Failed to fork snippet")
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleFork}
      disabled={isPending || forked}
      className="gap-1.5"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : forked ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <GitFork className="h-3.5 w-3.5" />
      )}
      {forked ? "Forked!" : "Fork"}
    </Button>
  )
}
