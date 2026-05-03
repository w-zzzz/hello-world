import Link from "next/link";
import { ArrowUpRight, GitBranch, Sparkles, Layers } from "lucide-react";
import {
  TOPICS,
  TOPIC_BY_SLUG,
  PART_BY_SLUG,
  topicsInPart,
} from "../../../content/curriculum";
import type { TopicMeta } from "@/lib/types";

type RelatedKind = "dependent" | "sibling" | "shared-prereq";

type Pick = TopicMeta & { kind: RelatedKind };

/** Choose three related topics for the given slug. We prefer:
 *   1. forward dependents (topics that list `slug` as a prereq) — these are
 *      the natural "what comes next?"
 *   2. siblings in the same part (by topicIndex proximity)
 *   3. topics that share at least one prerequisite (cousins)
 *  ...always deduping and skipping the source topic itself. */
function pickRelated(slug: string, limit = 3): Pick[] {
  const me = TOPIC_BY_SLUG[slug];
  if (!me) return [];

  const seen = new Set<string>([slug]);
  const out: Pick[] = [];
  const push = (t: TopicMeta | undefined, kind: RelatedKind) => {
    if (!t || seen.has(t.slug) || out.length >= limit) return;
    seen.add(t.slug);
    out.push({ ...t, kind });
  };

  // Forward dependents
  for (const t of TOPICS) {
    if (t.prereqs.includes(slug)) push(t, "dependent");
  }

  // Siblings in same part, ordered by distance from current topic index
  const siblings = topicsInPart(me.partSlug)
    .filter((t) => t.slug !== slug)
    .sort((a, b) => Math.abs(a.topicIndex - me.topicIndex) - Math.abs(b.topicIndex - me.topicIndex));
  for (const s of siblings) push(s, "sibling");

  // Cousins — share at least one prereq
  if (me.prereqs.length) {
    for (const t of TOPICS) {
      if (t.prereqs.some((p) => me.prereqs.includes(p))) push(t, "shared-prereq");
    }
  }

  return out.slice(0, limit);
}

const kindMeta: Record<RelatedKind, { label: string; Icon: typeof Sparkles }> = {
  dependent: { label: "Builds on this", Icon: Sparkles },
  sibling: { label: "Same part", Icon: Layers },
  "shared-prereq": { label: "Shared foundation", Icon: GitBranch },
};

export function RelatedTopics({ slug }: { slug: string }) {
  const items = pickRelated(slug);
  if (!items.length) return null;
  return (
    <section className="mt-20 pt-12 border-t border-soft" aria-label="Related topics">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Related topics</h2>
        <Link
          href="/map"
          className="text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1"
        >
          See the full map
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {items.map((t) => {
          const part = PART_BY_SLUG[t.partSlug];
          const km = kindMeta[t.kind];
          return (
            <li key={t.slug}>
              <Link
                href={`/learn/${t.slug}`}
                className="group block h-full rounded-2xl border border-soft surface p-5 hover:border-[var(--color-accent)]/40 hover:shadow-md hover:shadow-black/5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)]">
                    <km.Icon className="h-3 w-3" />
                    {km.label}
                  </span>
                  <span
                    className="grid h-5 w-5 place-items-center rounded text-[9px] font-semibold tabular-nums"
                    style={{
                      backgroundColor: `var(${part.hueVar})`,
                      color: `var(${part.hueVar}-fg)`,
                    }}
                    aria-hidden
                  >
                    {String(part.index).padStart(2, "0")}
                  </span>
                </div>
                <div className="mt-3 text-base font-semibold tracking-tight leading-snug text-balance">
                  {t.title}
                </div>
                <p className="mt-1.5 text-xs text-[var(--color-muted-fg)] leading-relaxed line-clamp-2 text-pretty">
                  {t.hook}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
