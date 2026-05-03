"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ERAS, EVENTS } from "@/lib/timeline";

/**
 * Side-rail mini timeline. Highlights the active era as the user scrolls
 * through the page. Clicking a year jumps to the nearest era section.
 */
export function TimelineScrubber({ activeEra }: { activeEra: string | null }) {
  const span = React.useMemo(() => {
    const ys = EVENTS.map((e) => e.year);
    return { start: Math.min(...ys), end: Math.max(...ys) };
  }, []);

  const total = span.end - span.start;

  return (
    <aside
      className="hidden lg:block sticky top-28 h-[calc(100vh-8rem)] py-4 select-none"
      aria-label="Era navigation"
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-semibold mb-3">
        Eras
      </div>
      <div className="relative h-full max-h-[600px] flex">
        {/* Vertical bar */}
        <div className="relative w-px bg-[var(--color-border)]">
          {ERAS.map((era) => {
            const startFrac = (era.yearRange[0] - span.start) / total;
            const endFrac = (era.yearRange[1] - span.start) / total;
            return (
              <span
                key={era.slug}
                aria-hidden
                className={cn(
                  "absolute left-[-1px] w-[3px] rounded-full transition-opacity duration-500",
                  activeEra === era.slug ? "opacity-100" : "opacity-30"
                )}
                style={{
                  top: `${startFrac * 100}%`,
                  height: `${Math.max(0.05, endFrac - startFrac) * 100}%`,
                  backgroundColor: era.hue,
                }}
              />
            );
          })}
        </div>

        {/* Era labels */}
        <ul className="ml-3 flex flex-col text-xs">
          {ERAS.map((era) => {
            const midFrac =
              (((era.yearRange[0] + era.yearRange[1]) / 2) - span.start) / total;
            return (
              <li
                key={era.slug}
                style={{ position: "absolute", top: `${midFrac * 100}%`, transform: "translateY(-50%)", left: "1rem" }}
              >
                <a
                  href={`#era-${era.slug}`}
                  className={cn(
                    "group flex items-center gap-2 whitespace-nowrap transition-colors",
                    activeEra === era.slug
                      ? "text-[var(--color-fg)] font-semibold"
                      : "text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
                  )}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full transition-transform"
                    style={{
                      backgroundColor: era.hue,
                      transform: activeEra === era.slug ? "scale(1.4)" : "scale(1)",
                    }}
                  />
                  <span className="tabular-nums">{era.yearRange[0]}</span>
                  <span className="text-[10px] opacity-70 hidden xl:inline">
                    {era.title.split(" ").slice(0, 3).join(" ")}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
