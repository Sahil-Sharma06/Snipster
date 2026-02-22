"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutGrid, Code2, FileText } from "lucide-react"

export type ContentType = "all" | "snippets" | "blogs"

interface ContentTypeSelectorProps {
  activeType: ContentType
}

const TYPES: { id: ContentType; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "snippets", label: "Snippets", icon: Code2 },
  { id: "blogs", label: "Blogs", icon: FileText },
]

export function ContentTypeSelector({ activeType }: ContentTypeSelectorProps) {
  const searchParams = useSearchParams()

  const buildHref = (type: ContentType) => {
    const params = new URLSearchParams(searchParams.toString())
    if (type === "all") {
      params.delete("type")
    } else {
      params.set("type", type)
    }
    params.delete("page")
    const qs = params.toString()
    return `/feed${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit">
      {TYPES.map(({ id, label, icon: Icon }) => (
        <Link
          key={id}
          href={buildHref(id)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            activeType === id
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Link>
      ))}
    </div>
  )
}
