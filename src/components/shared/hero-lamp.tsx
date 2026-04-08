"use client";

import React from "react";
import { motion } from "motion/react";
import { LampContainer } from "@/components/ui/lamp";

export function HeroLamp() {
  return (
    <LampContainer>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.2,
          duration: 0.8,
          ease: "easeOut",
        }}
        className="flex flex-col items-center justify-center text-center z-10 w-full"
      >
        <span className="text-[#C0C1FF] font-mono text-xs tracking-[0.25em] mb-6 block uppercase font-bold">V1.0 INITIALIZED</span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter font-headline bg-gradient-to-br from-slate-300 to-slate-500 bg-clip-text text-transparent leading-[1.1] py-2">
          Snipster — Stop Switching Tabs.<br /> Start Building Together.
        </h1>
      </motion.div>
    </LampContainer>
  );
}
