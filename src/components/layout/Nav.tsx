"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { Brain } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

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

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 8));

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-[color-mix(in_oklch,_var(--color-bg),_transparent_30%)] backdrop-blur-xl border-b border-soft"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
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
                className={cn(
                  "relative px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
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
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
