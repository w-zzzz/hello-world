"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

/** An inline glossary term. Renders the wrapped text with a dotted underline
 *  and a popover that surfaces the definition on hover, focus, or tap.
 *
 *  Usage in MDX:
 *    <Term definition="A vector space whose elements are functions.">
 *      Hilbert space
 *    </Term>
 */
export function Term({
  definition,
  link,
  children,
}: {
  definition: string;
  link?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline cursor-help underline decoration-dotted decoration-[var(--color-accent)]/60 underline-offset-4",
            "hover:decoration-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-sm"
          )}
          aria-label={typeof children === "string" ? `${children}: definition` : "Open definition"}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        >
          {children}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={6}
          className={cn(
            "z-50 max-w-xs rounded-xl border border-soft surface px-4 py-3 text-sm shadow-xl",
            "anim-fade-up"
          )}
        >
          <p className="text-[var(--color-fg)] leading-snug text-pretty">{definition}</p>
          {link && (
            <a
              href={link}
              className="mt-2 inline-block text-xs text-[var(--color-accent)] hover:underline"
              target={/^https?:/.test(link) ? "_blank" : undefined}
              rel={/^https?:/.test(link) ? "noreferrer" : undefined}
            >
              Read more →
            </a>
          )}
          <Popover.Arrow className="fill-[var(--color-card)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
