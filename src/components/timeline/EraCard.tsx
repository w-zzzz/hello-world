"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { EventDot } from "./EventDot";
import { CompoundArrow } from "./CompoundArrow";
import {
  type Era,
  type TimelineEvent,
  KIND_LABEL,
} from "@/lib/timeline";

type Props = {
  era: Era;
  events: TimelineEvent[];
  index: number;
  showArrows: boolean;
};

export function EraCard({ era, events, index, showArrows }: Props) {
  const reduce = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const counts = React.useMemo(() => {
    const c: Partial<Record<TimelineEvent["kind"], number>> = {};
    for (const e of events) c[e.kind] = (c[e.kind] ?? 0) + 1;
    return c;
  }, [events]);

  return (
    <section
      id={`era-${era.slug}`}
      data-era-slug={era.slug}
      className="relative scroll-mt-24"
    >
      {/* Soft gradient backdrop tied to era hue */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18]"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 20% 0%, ${era.hue}, transparent 65%), radial-gradient(ellipse 70% 50% at 100% 100%, color-mix(in oklch, ${era.hue}, transparent 50%), transparent 70%)`,
        }}
      />

      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <ScrollReveal>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{
                color: era.hue,
                backgroundColor: `color-mix(in oklch, ${era.hue}, transparent 88%)`,
              }}
            >
              <span className="tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>· Era</span>
            </span>
            <span className="text-sm tabular-nums text-[var(--color-muted-fg)]">
              {era.yearRange[0]}—{era.yearRange[1]}
            </span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05] text-balance">
            {era.title}
          </h2>
          <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--color-muted-fg)] text-pretty">
            {era.blurb}
          </p>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {era.themes.map((t) => (
              <span
                key={t}
                className="rounded-full border border-soft px-2.5 py-1 text-xs text-[var(--color-muted-fg)]"
              >
                {t}
              </span>
            ))}
            <span
              aria-hidden
              className="ml-2 h-1 w-1 rounded-full self-center bg-[var(--color-border)]"
            />
            <span className="rounded-full px-2.5 py-1 text-xs text-[var(--color-muted-fg)] font-medium">
              {events.length} events
            </span>
            {Object.entries(counts).map(([k, n]) => (
              <span
                key={k}
                className="rounded-full px-2 py-1 text-[11px] text-[var(--color-muted-fg)]"
              >
                {n}× {KIND_LABEL[k as TimelineEvent["kind"]].toLowerCase()}
              </span>
            ))}
          </div>
        </ScrollReveal>

        {/* Event list */}
        <motion.div
          ref={containerRef}
          initial={false}
          className="relative mt-14"
        >
          {showArrows && !reduce && (
            <CompoundArrow events={events} containerRef={containerRef} hue={era.hue} />
          )}
          <ol className="flex flex-col gap-6">
            {events.map((event, i) => (
              <EventDot key={event.id} event={event} index={i} hue={era.hue} />
            ))}
          </ol>
        </motion.div>
      </div>
    </section>
  );
}
