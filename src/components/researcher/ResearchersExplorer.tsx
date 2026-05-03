"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ResearcherCard } from "./ResearcherCard";
import type { Researcher } from "@/lib/types";

export function ResearchersExplorer({ researchers }: { researchers: Researcher[] }) {
  const [query, setQuery] = useState("");
  const [activeArea, setActiveArea] = useState<string | null>(null);

  const areas = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of researchers) {
      for (const a of r.area) counts.set(a, (counts.get(a) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [researchers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return researchers.filter((r) => {
      if (activeArea && !r.area.includes(activeArea)) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.short.toLowerCase().includes(q) ||
        r.affiliation.toLowerCase().includes(q) ||
        r.area.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [researchers, query, activeArea]);

  return (
    <div>
      <div className="mt-12 flex flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-fg)]" />
          <input
            aria-label="Search researchers"
            name="researchers-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, affiliation, area, or bio…"
            className="w-full rounded-2xl border border-soft surface pl-11 pr-10 py-3 text-sm outline-none focus:border-[var(--color-accent)]/50"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]/60"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={activeArea === null}
            onClick={() => setActiveArea(null)}
            label="All"
            count={researchers.length}
          />
          {areas.map(([a, c]) => (
            <Chip
              key={a}
              active={activeArea === a}
              onClick={() => setActiveArea(activeArea === a ? null : a)}
              label={a}
              count={c}
            />
          ))}
        </div>

        <div className="text-xs text-[var(--color-muted-fg)]">
          Showing <span className="font-semibold text-[var(--color-fg)]">{filtered.length}</span>{" "}
          of {researchers.length} researchers
          {activeArea && (
            <>
              {" "}in <span className="font-medium">{activeArea}</span>
            </>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-soft p-10 text-center text-sm text-[var(--color-muted-fg)]">
          No researchers match those filters.
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <ResearcherCard key={r.slug} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-[var(--color-accent)] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white"
          : "rounded-full border border-soft surface px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-fg)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-fg)]"
      }
    >
      {label}
      <span className={active ? "ml-1.5 opacity-80" : "ml-1.5 opacity-60"}>{count}</span>
    </button>
  );
}
