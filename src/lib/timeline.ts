import {
  EVENTS,
  EVENT_BY_ID,
  ERAS,
  ERA_BY_SLUG,
  type Era,
  type EventKind,
  type TimelineEvent,
} from "../../content/timeline";

export { EVENTS, EVENT_BY_ID, ERAS, ERA_BY_SLUG };
export type { Era, TimelineEvent, EventKind };

/** Color tokens per event kind. Use as `bg`, `text` or `border` via inline style. */
export const KIND_HUES: Record<EventKind, string> = {
  paper: "oklch(0.65 0.18 264)",
  model: "oklch(0.7 0.18 145)",
  milestone: "oklch(0.62 0.20 30)",
  system: "oklch(0.65 0.16 195)",
  controversy: "oklch(0.62 0.20 0)",
  company: "oklch(0.65 0.18 320)",
};

export const KIND_LABEL: Record<EventKind, string> = {
  paper: "Paper",
  model: "Model",
  milestone: "Milestone",
  system: "System",
  controversy: "Controversy",
  company: "Company",
};

/** Sort events stably by (year, month). */
export function sortEvents(es: TimelineEvent[]): TimelineEvent[] {
  return [...es].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return (a.month ?? 0) - (b.month ?? 0);
  });
}

export function eventsByEra(eraSlug: string): TimelineEvent[] {
  return sortEvents(EVENTS.filter((e) => e.era === eraSlug));
}

/** Format `Apr 2024` or `2024`. */
export function formatYearMonth(year: number, month?: number): string {
  if (!month) return String(year);
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month - 1];
  return `${m} ${year}`;
}

/** Total years spanned. */
export function timelineSpan(): { start: number; end: number; years: number } {
  const ys = EVENTS.map((e) => e.year);
  const start = Math.min(...ys);
  const end = Math.max(...ys);
  return { start, end, years: end - start + 1 };
}

/** Resolve a topic slug into the human-readable URL `/learn/<part>/<topic>`. */
export function topicHref(slug: string): string {
  return `/learn/${slug}`;
}

export function researcherHref(slug: string): string {
  return `/researchers/${slug}`;
}

/** All era counts. */
export function eraCounts(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of EVENTS) out[e.era] = (out[e.era] ?? 0) + 1;
  return out;
}
