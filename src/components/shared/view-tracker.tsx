"use client"

import { useEffect, useRef } from "react"

interface ViewTrackerProps {
  /** POST endpoint to call once, e.g. /api/snippets/abc123/view */
  endpoint: string
}

/**
 * Invisible client component that fires a single POST to increment the view
 * count when the page mounts. Uses a ref to prevent double-fire in
 * React 18 Strict-Mode development double-effect.
 */
export function ViewTracker({ endpoint }: ViewTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    fetch(endpoint, { method: "POST" }).catch(() => {
      // Silently ignore network errors — views are non-critical
    })
  }, [endpoint])

  return null
}
