"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Clock, Flame, Eye, MessageCircle, type LucideIcon } from "lucide-react"

export type SortOption = "latest" | "popular" | "viewed" | "discussed"

interface SortSelectorProps {
  activeSort: SortOption
  basePath?: string
}

const SORT_OPTIONS: { id: SortOption; label: string; icon: LucideIcon }[] = [
  { id: "latest", label: "Latest", icon: Clock },
  { id: "popular", label: "Most Liked", icon: Flame },
  { id: "viewed", label: "Most Viewed", icon: Eye },
  { id: "discussed", label: "Most Discussed", icon: MessageCircle },
]

export function SortSelector({ activeSort, basePath = "/feed" }: SortSelectorProps) {
  const searchParams = useSearchParams()

  const buildHref = (sort: SortOption) => {
    const params = new URLSearchParams(searchParams.toString())
    if (sort === "latest") {
      params.delete("sort")
    } else {
      params.set("sort", sort)
    }
    params.delete("page")
    const qs = params.toString()
    return basePath + (qs ? `?${qs}` : "")
  }

  return (
    <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit flex-wrap">
      {SORT_OPTIONS.map(({ id, label, icon: Icon }) => (
        <Link
          key={id}
          href={buildHref(id)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            activeSort === id
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
