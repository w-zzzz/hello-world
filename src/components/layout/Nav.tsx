"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { Brain, Command } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { openCommandPalette } from "@/components/CommandPalette";
import { cn } from "@/lib/utils";
import { TOPIC_BY_SLUG, PART_BY_SLUG } from "../../../content/curriculum";

const links = [
  { href: "/map", label: "Map" },
  { href: "/learn/03-deep-learning/04-attention", label: "Learn" },
  { href: "/researchers", label: "Researchers" },
  { href: "/resources", label: "Resources" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Nav() {
  const path = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [isMac, setIsMac] = React.useState(false);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 8));

  React.useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  // Now-reading: detect /learn/<part>/<topic> and look up the part hue.
  const reading = React.useMemo(() => {
    const m = path.match(/^\/learn\/([^/]+)\/([^/?#]+)/);
    if (!m) return null;
    const slug = `${m[1]}/${m[2]}`;
    const topic = TOPIC_BY_SLUG[slug];
    if (!topic) return null;
    const part = PART_BY_SLUG[topic.partSlug];
    return { topic, part };
  }, [path]);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-[color-mix(in_oklch,_var(--color-bg),_transparent_30%)] backdrop-blur-xl border-b border-soft"
          : "bg-transparent"
      )}
    >
      <nav aria-label="Primary" className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          aria-label="MLMap home"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        >
          <motion.div
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-part-7)] text-white"
          >
            <Brain className="h-4 w-4" />
          </motion.div>
          <span>MLMap</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = path.startsWith(l.href.split("?")[0]);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
                  active
                    ? "text-[var(--color-fg)]"
                    : "text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="navHighlight"
                    transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-0 rounded-full bg-[var(--color-muted)]"
                  />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openCommandPalette()}
            aria-label="Open command palette"
            title="Search · ⌘K"
            className={cn(
              "hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-full border border-soft",
              "text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] hover:bg-[var(--color-muted)] transition-colors"
            )}
          >
            <Command className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Search</span>
            <kbd className="ml-0.5 inline-flex items-center gap-0.5 rounded border border-soft px-1 py-0.5 text-[10px] font-mono">
              {isMac ? "⌘" : "Ctrl"}K
            </kbd>
          </button>
          <ThemeToggle />
        </div>
      </nav>

      {/* Now-reading stripe — only renders on /learn/* pages. */}
      {reading && (
        <motion.div
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          className="mx-auto max-w-7xl px-6 -mt-px"
        >
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)]">
            <span
              aria-hidden
              className="h-[2px] flex-1 rounded-full"
              style={{
                background: `linear-gradient(to right, var(${reading.part.hueVar}), color-mix(in oklch, var(${reading.part.hueVar}), transparent 70%))`,
              }}
            />
            <span className="shrink-0 truncate max-w-[60vw]">
              <span className="text-[var(--color-fg)] font-medium normal-case tracking-normal">
                {reading.topic.title}
              </span>
              <span className="ml-2">· {reading.part.short}</span>
            </span>
            <span aria-hidden className="h-[2px] w-8 rounded-full bg-[var(--color-border)]" />
          </div>
        </motion.div>
      )}
    </header>
  );
}
