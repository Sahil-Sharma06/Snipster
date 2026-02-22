"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Globe, Users } from "lucide-react"

interface FeedTabsProps {
  activeTab: string
}

export function FeedTabs({ activeTab }: FeedTabsProps) {
  const searchParams = useSearchParams()

  const buildHref = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "everyone") {
      params.delete("tab")
    } else {
      params.set("tab", tab)
    }
    params.delete("page")
    const qs = params.toString()
    return `/feed${qs ? `?${qs}` : ""}`
  }

  const tabs = [
    { id: "everyone", label: "Everyone", icon: Globe },
    { id: "following", label: "Following", icon: Users },
  ]

  return (
    <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={buildHref(tab.id)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            activeTab === tab.id
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <tab.icon className="h-3.5 w-3.5" />
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
