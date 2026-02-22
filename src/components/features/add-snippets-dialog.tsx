"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Search } from "lucide-react"
import { toast } from "sonner"

interface Snippet {
  id: string
  title: string
  language: string
  description: string | null
}

interface AddSnippetsDialogProps {
  collectionId: string
  /** IDs of snippets already in the collection */
  existingSnippetIds: string[]
}

export function AddSnippetsDialog({
  collectionId,
  existingSnippetIds,
}: AddSnippetsDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  // Load user's snippets when dialog opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch("/api/snippets?authorId=me&limit=100")
      .then((r) => r.json())
      .then((data) => setSnippets(Array.isArray(data.snippets) ? data.snippets : []))
      .catch(() => toast.error("Failed to load snippets"))
      .finally(() => setLoading(false))
  }, [open])

  const filtered = snippets.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.language.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleAdd = async () => {
    if (selected.size === 0) return

    const toAdd = [...selected].filter((id) => !existingSnippetIds.includes(id))
    if (toAdd.length === 0) {
      toast.info("All selected snippets are already in this collection.")
      return
    }

    startTransition(async () => {
      try {
        await Promise.all(
          toAdd.map((snippetId) =>
            fetch(`/api/collections/${collectionId}/snippets`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ snippetId }),
            }).then(async (res) => {
              if (!res.ok) throw new Error(await res.text())
            })
          )
        )

        toast.success(
          toAdd.length === 1
            ? "Snippet added to collection!"
            : `${toAdd.length} snippets added to collection!`
        )
        setSelected(new Set())
        setOpen(false)
        router.refresh()
      } catch {
        toast.error("Failed to add some snippets. Please try again.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Snippets
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add snippets to collection</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search snippets..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {snippets.length === 0
                ? "You have no snippets yet."
                : "No snippets match your search."}
            </p>
          ) : (
            filtered.map((snippet) => {
              const alreadyIn = existingSnippetIds.includes(snippet.id)
              const isChecked = selected.has(snippet.id) || alreadyIn

              return (
                <label
                  key={snippet.id}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                    alreadyIn
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-muted/60"
                  }`}
                >
                  <Checkbox
                    checked={isChecked}
                    disabled={alreadyIn}
                    onCheckedChange={() => !alreadyIn && toggle(snippet.id)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">
                      {snippet.title}
                    </p>
                    {snippet.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {snippet.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-5 capitalize shrink-0"
                  >
                    {snippet.language}
                  </Badge>
                  {alreadyIn && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      added
                    </span>
                  )}
                </label>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">
            {selected.size > 0 ? `${selected.size} selected` : "Select snippets to add"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={selected.size === 0 || isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
