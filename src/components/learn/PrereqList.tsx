import Link from "next/link";
import { TOPIC_BY_SLUG, PART_BY_SLUG } from "../../../content/curriculum";

export function PrereqList({ prereqs }: { prereqs: string[] }) {
  if (!prereqs.length) return null;
  return (
    <div className="mt-8 rounded-2xl border border-soft surface p-5">
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
        Prerequisites
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {prereqs.map((slug) => {
          const t = TOPIC_BY_SLUG[slug];
          if (!t) return null;
          const part = PART_BY_SLUG[t.partSlug];
          return (
            <li key={slug}>
              <Link
                href={`/learn/${slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-soft bg-[var(--color-bg)] px-3 py-1.5 text-sm hover:border-[var(--color-accent)]/40 transition-colors"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: `var(${part.hueVar})` }}
                />
                {t.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
