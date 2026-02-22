"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"

interface RemoveSnippetButtonProps {
  collectionId: string
  snippetId: string
}

export function RemoveSnippetButton({
  collectionId,
  snippetId,
}: RemoveSnippetButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault() // don't follow the snippet card link
    e.stopPropagation()

    startTransition(async () => {
      try {
        const res = await fetch(`/api/collections/${collectionId}/snippets`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snippetId }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Failed to remove snippet")
        }

        toast.success("Snippet removed from collection")
        router.refresh()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to remove snippet"
        )
      }
    })
  }

  return (
    <Button
      variant="destructive"
      size="icon"
      className="h-7 w-7 rounded-full shadow-md"
      onClick={handleRemove}
      disabled={isPending}
      title="Remove from collection"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <X className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}
