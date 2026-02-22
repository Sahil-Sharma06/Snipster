"use client"

import { formatDistanceToNow } from "date-fns"

interface RelativeTimeProps {
  date: Date | string
  className?: string
}

/**
 * Renders a relative time string (e.g. "3 minutes ago").
 * Uses suppressHydrationWarning so React does not throw a hydration
 * mismatch when the server-rendered timestamp differs slightly from the
 * client-rendered one (which is expected for time-relative values).
 */
export function RelativeTime({ date, className }: RelativeTimeProps) {
  return (
    <span suppressHydrationWarning className={className}>
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </span>
  )
}
