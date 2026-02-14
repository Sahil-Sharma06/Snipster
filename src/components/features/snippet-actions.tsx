"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface SnippetActionsProps {
  snippetId: string
  isAuthor: boolean
}

export function SnippetActions({ snippetId, isAuthor }: SnippetActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  if (!isAuthor) {
    return null
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/snippets/${snippetId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to delete snippet",
        }))
        toast.error(errorData.error || "Something went wrong")
        return
      }

      toast.success("Snippet deleted successfully")
      router.push("/feed")
      router.refresh()
    } catch (error) {
      console.error("Error deleting snippet:", error)
      toast.error("Failed to delete snippet. Please try again.")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Link href={`/snippets/${snippetId}/edit`}>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </Link>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              snippet and remove it from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
