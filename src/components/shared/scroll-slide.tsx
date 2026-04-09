"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

interface ScrollSlideProps {
  direction?: "left" | "right"
  offset?: number
  duration?: number
  ease?: [number, number, number, number]
  className?: string
  children: React.ReactNode
}

export function ScrollSlide({
  direction = "left",
  offset = 80,
  duration = 0.6,
  ease = [0.22, 1, 0.36, 1],
  className,
  children,
}: ScrollSlideProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { amount: 0.3, once: false })

  const startX = direction === "left" ? -offset : offset

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={{
        opacity: inView ? 1 : 0,
        x: inView ? 0 : startX,
      }}
      transition={{ duration, ease }}
    >
      {children}
    </motion.div>
  )
}
