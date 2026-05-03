"use client";

import * as React from "react";
import { GitBranch } from "lucide-react";
import { motion } from "motion/react";
import { ERAS, eventsByEra, eraCounts } from "@/lib/timeline";
import { EraCard } from "./EraCard";
import { EraChips } from "./EraChips";
import { TimelineScrubber } from "./TimelineScrubber";
import { cn } from "@/lib/utils";

export function TimelineExperience() {
  const [activeEra, setActiveEra] = React.useState<string | null>(ERAS[0].slug);
  const [showArrows, setShowArrows] = React.useState(true);
  const counts = React.useMemo(() => eraCounts(), []);

  // Track which era is in view via IntersectionObserver
  React.useEffect(() => {
    const sections = ERAS.map((e) => document.getElementById(`era-${e.slug}`)).filter(
      (el): el is HTMLElement => !!el
    );
    if (sections.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the entry whose top is closest to (above) the viewport top.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.id.replace(/^era-/, "");
          setActiveEra(id);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: 0,
      }
    );

    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <div className="sticky top-16 z-20 bg-[var(--color-bg)]/85 backdrop-blur border-b border-soft">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <EraChips activeEra={activeEra} counts={counts} />
          </div>
          <button
            type="button"
            onClick={() => setShowArrows((v) => !v)}
            className={cn(
              "shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              showArrows
                ? "border-[var(--color-fg)]/40 bg-[var(--color-fg)] text-[var(--color-bg)]"
                : "border-soft text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
            )}
            aria-pressed={showArrows}
            aria-label="Toggle compound arrows"
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Compound arrows</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-0 lg:px-6 lg:grid lg:grid-cols-[1fr_180px] lg:gap-8">
        <motion.div
          layout
          transition={{ layout: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } }}
          className="min-w-0"
        >
          {ERAS.map((era, i) => (
            <EraCard
              key={era.slug}
              era={era}
              events={eventsByEra(era.slug)}
              index={i}
              showArrows={showArrows}
            />
          ))}
        </motion.div>
        <TimelineScrubber activeEra={activeEra} />
      </div>
    </>
  );
}
