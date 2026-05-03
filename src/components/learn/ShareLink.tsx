"use client";

import * as React from "react";
import { Check, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

/** Copy the canonical URL of the current topic to the clipboard with a
 *  small inline toast confirmation. Falls back to a window.prompt-style
 *  selection if the Clipboard API is unavailable. */
export function ShareLink({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | null>(null);

  const onCopy = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/learn/${slug}`;
    try {
      if (navigator.share && /Mobi|Android|iPhone|iPad/.test(navigator.userAgent)) {
        await navigator.share({ title, url }).catch(() => {});
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  React.useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy link to this topic"
        title="Copy link"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-soft px-2.5 py-1 text-xs text-[var(--color-muted-fg)]",
          "hover:text-[var(--color-fg)] hover:bg-[var(--color-muted)] transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        )}
      >
        {copied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
        <span>{copied ? "Copied" : "Share"}</span>
      </button>
      <AnimatePresence>
        {copied && (
          <motion.span
            key="toast"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded-md border border-soft surface px-2 py-1 text-[10px] text-[var(--color-muted-fg)] shadow-lg"
          >
            Link copied to clipboard
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
