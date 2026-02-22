"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Code2, FileText, FolderOpen, Users, UserPlus } from "lucide-react"

interface ProfileTabsProps {
  activeTab: string
  username: string
}

const tabs = [
  { id: "snippets", label: "Snippets", icon: Code2 },
  { id: "blogs", label: "Blog Posts", icon: FileText },
  { id: "collections", label: "Collections", icon: FolderOpen },
  { id: "followers", label: "Followers", icon: Users },
  { id: "following", label: "Following", icon: UserPlus },
]

export function ProfileTabs({ activeTab, username }: ProfileTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border border-border/60 bg-muted/30 p-1 w-fit max-w-full">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={
            tab.id === "snippets"
              ? `/profile/${username}`
              : `/profile/${username}?tab=${tab.id}`
          }
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all",
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
