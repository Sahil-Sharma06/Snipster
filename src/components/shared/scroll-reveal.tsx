"use client"

import { useEffect, useRef, useState } from "react"

interface ScrollRevealProps {
  className?: string
  children: React.ReactNode
  threshold?: number
}

export function ScrollReveal({
  className,
  children,
  threshold = 0.25,
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [threshold])

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-700 ease-out will-change-transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  )
}
