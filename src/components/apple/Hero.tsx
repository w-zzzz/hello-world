"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero() {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.6, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden min-h-[100svh] flex items-center justify-center pt-20"
    >
      {/* gradient mesh bg */}
      <div className="pointer-events-none absolute inset-0 -z-10 gradient-mesh opacity-90" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,_color-mix(in_oklch,_var(--color-accent),_transparent_88%)_0%,_transparent_70%)]" />
      {/* grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 80%)",
        }}
      />

      <motion.div
        style={reduce ? undefined : { y, opacity, scale }}
        className="relative mx-auto max-w-5xl px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-soft px-4 py-1.5 text-xs font-medium text-[var(--color-muted-fg)] backdrop-blur-md surface/60"
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          A PhD-grade learning map for modern AI
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.0, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
          className="mt-8 text-5xl sm:text-7xl md:text-[88px] font-semibold leading-[1.02] tracking-[-0.04em] text-balance"
        >
          Master modern AI.
          <br />
          <span className="bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-part-7)] to-[var(--color-part-10)] bg-clip-text text-transparent">
            From first principles.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="mt-7 mx-auto max-w-2xl text-lg sm:text-xl text-[var(--color-muted-fg)] leading-relaxed text-pretty"
        >
          Forty-six topics. Eleven parts. From linear algebra to{" "}
          <span className="text-[var(--color-fg)] font-medium">Mamba</span>,{" "}
          <span className="text-[var(--color-fg)] font-medium">DeepSeek-R1</span>, and{" "}
          <span className="text-[var(--color-fg)] font-medium">JEPA</span> — with hand-built
          interactive visualizations and a quiz at every stop.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/map"
            className={cn(
              "group inline-flex items-center gap-2 rounded-full bg-[var(--color-fg)] text-[var(--color-bg)]",
              "px-7 py-3.5 text-base font-medium",
              "transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-100"
            )}
          >
            Open the learning map
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/learn/03-deep-learning/04-attention"
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-soft",
              "px-7 py-3.5 text-base font-medium text-[var(--color-fg)]",
              "transition-all duration-300 hover:bg-[var(--color-muted)]"
            )}
          >
            Start with attention
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.9 }}
          className="mt-20 grid grid-cols-3 gap-x-8 sm:gap-x-16 max-w-2xl mx-auto"
        >
          {[
            { n: 46, l: "topics" },
            { n: 12, l: "interactives" },
            { n: 55, l: "researchers" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-3xl sm:text-4xl font-semibold tabular-nums tracking-tight">
                {s.n}
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)]">
                {s.l}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[var(--color-muted-fg)]"
      >
        <div className="flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
          <span>Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-6 w-[2px] bg-[var(--color-muted-fg)]/40 rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}
