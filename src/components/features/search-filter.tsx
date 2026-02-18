"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCallback, useState, useTransition } from "react"

const QUICK_FILTERS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "go",
  "rust",
  "html",
  "css",
]

export function SearchFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const currentSearch = searchParams.get("search") || ""
  const currentLanguage = searchParams.get("language") || ""
  const [searchValue, setSearchValue] = useState(currentSearch)

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      startTransition(() => {
        router.push(`/feed?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams("search", searchValue.trim())
  }

  const toggleLanguage = (lang: string) => {
    updateParams("language", currentLanguage === lang ? "" : lang)
  }

  const clearFilters = () => {
    setSearchValue("")
    startTransition(() => {
      router.push("/feed")
    })
  }

  const hasFilters = currentSearch || currentLanguage

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search snippets by title or description..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10 h-11"
        />
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Filter:</span>
        {QUICK_FILTERS.map((lang) => (
          <Badge
            key={lang}
            variant={currentLanguage === lang ? "default" : "outline"}
            className="cursor-pointer capitalize transition-colors hover:bg-primary hover:text-primary-foreground"
            onClick={() => toggleLanguage(lang)}
          >
            {lang}
          </Badge>
        ))}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs text-muted-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
