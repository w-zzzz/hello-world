"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import { Brain, Command, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { openCommandPalette } from "@/components/CommandPalette";
import { cn } from "@/lib/utils";
import { TOPIC_BY_SLUG, PART_BY_SLUG } from "../../../content/curriculum";

const links = [
  { href: "/map", label: "Map" },
  { href: "/learn/03-deep-learning/04-attention", label: "Learn" },
  { href: "/timeline", label: "Timeline" },
  { href: "/paths", label: "Paths" },
  { href: "/stories", label: "Stories" },
  { href: "/researchers", label: "Researchers" },
  { href: "/resources", label: "Resources" },
  { href: "/dashboard", label: "Dashboard" },
];

// On the desktop bar we keep things tight — show only the most important
// links. The full set is available in the mobile sheet and the command palette.
const desktopLinks = links.filter((l) =>
  ["Map", "Learn", "Researchers", "Resources", "Dashboard"].includes(l.label)
);

export function Nav() {
  const path = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [isMac, setIsMac] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 8));

  React.useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  // Auto-close the mobile sheet whenever the route changes.
  React.useEffect(() => {
    setMobileOpen(false);
  }, [path]);

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
          {desktopLinks.map((l) => {
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
          <MobileNav
            open={mobileOpen}
            onOpenChange={setMobileOpen}
            path={path}
            isMac={isMac}
          />
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

function MobileNav({
  open,
  onOpenChange,
  path,
  isMac,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  path: string;
  isMac: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open navigation menu"
          className={cn(
            "md:hidden h-9 w-9 grid place-items-center rounded-full border border-soft text-[var(--color-fg)]",
            "hover:bg-[var(--color-muted)] transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
          )}
        >
          <Menu className="h-4 w-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  initial={{ opacity: 0, x: "100%" }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: "100%" }}
                  transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
                  className={cn(
                    "fixed right-0 top-0 z-50 h-full w-[88vw] max-w-sm",
                    "bg-[var(--color-bg)] border-l border-soft shadow-2xl",
                    "flex flex-col"
                  )}
                >
                  <div className="flex items-center justify-between px-5 h-14 border-b border-soft">
                    <Dialog.Title className="text-sm font-semibold tracking-tight">
                      Navigate
                    </Dialog.Title>
                    <Dialog.Close
                      className={cn(
                        "h-8 w-8 grid place-items-center rounded-full border border-soft",
                        "hover:bg-[var(--color-muted)] transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                      )}
                      aria-label="Close menu"
                    >
                      <X className="h-4 w-4" />
                    </Dialog.Close>
                  </div>
                  <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <ul className="space-y-1">
                      {links.map((l) => {
                        const active = path.startsWith(l.href.split("?")[0]);
                        return (
                          <li key={l.href}>
                            <Link
                              href={l.href}
                              className={cn(
                                "block rounded-xl px-4 py-3 text-base font-medium transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
                                active
                                  ? "bg-[var(--color-muted)] text-[var(--color-fg)]"
                                  : "text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)]"
                              )}
                            >
                              {l.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                  <div className="border-t border-soft px-5 py-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        // Defer so the dialog can finish closing before the
                        // command palette steals focus.
                        setTimeout(() => openCommandPalette(), 200);
                      }}
                      className="inline-flex items-center gap-2 text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-colors"
                    >
                      <Command className="h-3.5 w-3.5" />
                      Search
                      <kbd className="inline-flex items-center gap-0.5 rounded border border-soft px-1 py-0.5 text-[10px] font-mono">
                        {isMac ? "⌘" : "Ctrl"}K
                      </kbd>
                    </button>
                    <ThemeToggle />
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
