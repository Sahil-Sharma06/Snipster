"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "motion/react";

export function TypingCodeBlock() {
  const codeLines = [
    { text: "const", class: "text-tertiary" },
    { text: " snipster = ", class: "text-on-surface-variant" },
    { text: "{\n", class: "text-on-surface-variant" },
    { text: "  code", class: "text-primary" },
    { text: ": ", class: "text-on-surface-variant" },
    { text: "true", class: "text-[#a5d6ff]" },
    { text: ",\n  ", class: "text-on-surface-variant" },
    { text: "community", class: "text-primary" },
    { text: ": ", class: "text-on-surface-variant" },
    { text: "true", class: "text-[#a5d6ff]" },
    { text: ",\n  ", class: "text-on-surface-variant" },
    { text: "growth", class: "text-primary" },
    { text: ": ", class: "text-on-surface-variant" },
    { text: "true", class: "text-[#a5d6ff]" },
    { text: "\n};\n\n", class: "text-on-surface-variant" },
    { text: "snipster", class: "text-tertiary" },
    { text: ".", class: "text-on-surface-variant" },
    { text: "launch", class: "text-primary" },
    { text: "();", class: "text-on-surface-variant" }
  ];

  const totalChars = codeLines.reduce((acc, line) => acc + line.text.length, 0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldType, setShouldType] = useState(false);
  const [charsTyped, setCharsTyped] = useState(0);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion) {
      setCharsTyped(totalChars);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldType(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [prefersReducedMotion, totalChars]);

  useEffect(() => {
    if (!shouldType) return;
    let current = 0;
    let interval: NodeJS.Timeout;
    
    // Delay typing start slightly to let page load / lamp initial animations finish
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        if (current < totalChars) {
          current += 2; // Type 2 chars at a time for faster rendering
          setCharsTyped(current);
        } else {
          clearInterval(interval);
        }
      }, 15);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [shouldType, totalChars]);

  let renderedChars = 0;

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.8 }}
      className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-2xl overflow-hidden"
    >
      <div className="flex gap-2 mb-6">
        <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
        <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
      </div>
      <pre className="font-mono text-sm leading-7 overflow-x-auto min-h-[200px] sm:min-h-[230px] lg:min-h-[250px]">
        <code className="text-on-surface-variant whitespace-pre-wrap">
          {codeLines.map((line, i) => {
            if (renderedChars >= charsTyped) return null;
            const charsToRender = Math.min(line.text.length, charsTyped - renderedChars);
            renderedChars += line.text.length;
            return (
              <span key={i} className={line.class}>
                {line.text.substring(0, charsToRender)}
              </span>
            );
          })}
          {/* Blinking Cursor */}
          <span 
            className={`inline-block w-[3px] h-[1em] bg-primary ml-1 translate-y-1 ${
              charsTyped >= totalChars ? "animate-pulse" : ""
            }`}
          ></span>
        </code>
      </pre>
    </motion.div>
  );
}
