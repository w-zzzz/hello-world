"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type Heading = { id: string; text: string; level: 2 | 3 };

/** Slugify the way rehype-slug does (github-slugger): lowercased, non-word
 *  chars stripped, spaces → "-". Good-enough match for our content. */
function slug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Pull h2/h3 headings out of raw MDX source. We deliberately ignore code
 *  fences so a `# foo` inside python doesn't masquerade as a heading. */
export function extractHeadings(mdxSource: string): Heading[] {
  const out: Heading[] = [];
  const lines = mdxSource.split(/\r?\n/);
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const level = m[1].length === 2 ? 2 : 3;
    const text = m[2].replace(/[*_`]/g, "").trim();
    if (!text) continue;
    out.push({ id: slug(text), text, level: level as 2 | 3 });
  }
  return out;
}

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [active, setActive] = React.useState<string | null>(headings[0]?.id ?? null);

  React.useEffect(() => {
    if (!headings.length) return;
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;

    // Track which headings are currently above the read line — pick the last
    // one that's still above. This feels closer to "what am I reading now"
    // than IntersectionObserver's binary in/out.
    const onScroll = () => {
      const y = window.scrollY + 140; // account for sticky nav
      let current: string | null = els[0]?.id ?? null;
      for (const el of els) {
        if (el.offsetTop <= y) current = el.id;
        else break;
      }
      if (current) setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium mb-3">
        On this page
      </div>
      <ul className="relative space-y-1.5 border-l border-soft">
        {headings.map((h) => {
          const isActive = active === h.id;
          return (
            <li key={h.id} className={cn(h.level === 3 && "ml-3")}>
              <a
                href={`#${h.id}`}
                className={cn(
                  "relative block py-1 pl-3 -ml-px border-l-2 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-r",
                  isActive
                    ? "border-[var(--color-accent)] text-[var(--color-fg)] font-medium"
                    : "border-transparent text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
                )}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
