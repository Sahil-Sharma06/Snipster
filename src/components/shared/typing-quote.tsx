"use client"

import { useEffect, useMemo, useRef, useState } from "react"

interface TypingQuoteProps {
  text: string
  className?: string
  typingSpeedMs?: number
  startDelayMs?: number
}

export function TypingQuote({
  text,
  className,
  typingSpeedMs = 30,
  startDelayMs = 150,
}: TypingQuoteProps) {
  const containerRef = useRef<HTMLParagraphElement | null>(null)
  const [shouldType, setShouldType] = useState(false)
  const [charsTyped, setCharsTyped] = useState(0)

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion) {
      setCharsTyped(text.length)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldType(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [prefersReducedMotion, text.length])

  useEffect(() => {
    if (!shouldType) return
    let timeoutId: number | undefined
    let intervalId: number | undefined

    timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setCharsTyped((prev) => {
          if (prev >= text.length) {
            if (intervalId) window.clearInterval(intervalId)
            return prev
          }
          return prev + 1
        })
      }, typingSpeedMs)
    }, startDelayMs)

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [shouldType, startDelayMs, text.length, typingSpeedMs])

  const visibleText = text.slice(0, charsTyped)
  const showCursor = charsTyped < text.length

  return (
    <p ref={containerRef} className={className}>
      <span aria-hidden="true">"</span>
      <span>{visibleText}</span>
      {showCursor && (
        <span
          aria-hidden="true"
          className="inline-block w-[2px] h-[1em] align-text-bottom bg-[#d2bbff] ml-1 animate-pulse"
        />
      )}
      <span aria-hidden="true">"</span>
    </p>
  )
}
