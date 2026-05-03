"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, GitBranch } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  KIND_HUES,
  KIND_LABEL,
  EVENT_BY_ID,
  formatYearMonth,
  researcherHref,
  topicHref,
  type TimelineEvent,
} from "@/lib/timeline";
import { TOPIC_BY_SLUG } from "../../../content/curriculum";
import { RESEARCHER_BY_SLUG } from "../../../content/researchers";

type Props = {
  event: TimelineEvent;
  index: number;
  hue: string;
};

export function EventDot({ event, index, hue }: Props) {
  const reduce = useReducedMotion();
  const kindHue = KIND_HUES[event.kind];

  return (
    <motion.li
      id={`event-${event.id}`}
      data-event-id={event.id}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15% 0px -10% 0px" }}
      transition={{ duration: 0.7, delay: Math.min(index * 0.04, 0.25), ease: [0.32, 0.72, 0, 1] }}
      className="relative pl-12 sm:pl-16"
    >
      {/* spine + bullet */}
      <span
        aria-hidden
        className="absolute left-[14px] sm:left-[22px] top-0 bottom-0 w-px bg-[var(--color-border)]"
      />
      <span
        aria-hidden
        className="absolute left-[8px] sm:left-[16px] top-7 grid h-[14px] w-[14px] place-items-center rounded-full ring-4 ring-[var(--color-bg)]"
        style={{ backgroundColor: hue }}
      />

      <article
        className={cn(
          "rounded-2xl border border-soft bg-[var(--color-card)] p-5 sm:p-6",
          "transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:border-[var(--color-fg)]/15"
        )}
      >
        <header className="flex flex-wrap items-start gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="tabular-nums text-[var(--color-muted-fg)]">
              {formatYearMonth(event.year, event.month)}
            </span>
            <span className="h-1 w-1 rounded-full bg-[var(--color-border)]" aria-hidden />
            <span
              className="rounded-full px-2 py-0.5 uppercase tracking-[0.12em] text-[10px] font-semibold"
              style={{
                color: kindHue,
                backgroundColor: `color-mix(in oklch, ${kindHue}, transparent 88%)`,
              }}
            >
              {KIND_LABEL[event.kind]}
            </span>
          </div>
          {event.url && (
            <Link
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-accent)] transition-colors"
            >
              Source
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </header>

        <h3 className="mt-3 text-xl sm:text-2xl font-semibold tracking-tight leading-tight text-balance">
          {event.title}
        </h3>
        {event.byline && (
          <p className="mt-1 text-sm text-[var(--color-muted-fg)] font-medium">{event.byline}</p>
        )}
        <p className="mt-3 text-sm sm:text-base leading-relaxed text-[var(--color-muted-fg)] text-pretty">
          {event.blurb}
        </p>

        {/* Researcher chips */}
        {event.researcherSlugs && event.researcherSlugs.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {event.researcherSlugs.map((slug) => {
              const r = RESEARCHER_BY_SLUG[slug];
              if (!r) return null;
              return (
                <Link
                  key={slug}
                  href={researcherHref(slug)}
                  className="inline-flex items-center gap-1 rounded-full border border-soft px-2.5 py-1 text-xs font-medium text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] hover:border-[var(--color-fg)]/30 transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden />
                  {r.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Topic chips */}
        {event.topicSlugs && event.topicSlugs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {event.topicSlugs.map((slug) => {
              const t = TOPIC_BY_SLUG[slug];
              if (!t) return null;
              return (
                <Link
                  key={slug}
                  href={topicHref(slug)}
                  className="group inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium hover:underline"
                  style={{
                    color: `var(--color-part-${t.partIndex})`,
                    backgroundColor: `color-mix(in oklch, var(--color-part-${t.partIndex}), transparent 90%)`,
                  }}
                >
                  {t.title}
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              );
            })}
          </div>
        )}

        {/* builds_on links */}
        {event.builds_on && event.builds_on.length > 0 && (
          <div className="mt-4 pt-3 border-t border-soft flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-[var(--color-muted-fg)]">
            <GitBranch className="h-3 w-3" aria-hidden />
            <span className="font-medium">Builds on</span>
            {event.builds_on.map((id) => {
              const target = EVENT_BY_ID[id];
              if (!target) return null;
              return (
                <a
                  key={id}
                  href={`#event-${id}`}
                  className="rounded-full border border-soft px-2 py-0.5 hover:text-[var(--color-fg)] hover:border-[var(--color-fg)]/30 transition-colors"
                >
                  {target.title}
                </a>
              );
            })}
          </div>
        )}
      </article>
    </motion.li>
  );
}
