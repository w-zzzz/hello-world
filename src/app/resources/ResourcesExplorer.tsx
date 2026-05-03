"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  GraduationCap,
  Library,
  MonitorPlay,
  Search,
  Wrench,
  X,
} from "lucide-react";
import type { ExternalResource } from "@/lib/types";

const ICON: Record<ExternalResource["kind"], React.ComponentType<{ className?: string }>> = {
  book: BookOpen,
  course: GraduationCap,
  blog: FileText,
  paper: FileText,
  video: MonitorPlay,
  model: Library,
  dataset: Library,
  library: Wrench,
  doc: FileText,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ResourcesExplorer({
  resources,
}: {
  resources: Record<string, ExternalResource[]>;
}) {
  const [query, setQuery] = useState("");
  const categories = Object.keys(resources);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resources;
    const out: Record<string, ExternalResource[]> = {};
    for (const cat of categories) {
      const matched = resources[cat].filter((r) => {
        return (
          r.title.toLowerCase().includes(q) ||
          (r.source ?? "").toLowerCase().includes(q) ||
          (r.notes ?? "").toLowerCase().includes(q) ||
          cat.toLowerCase().includes(q)
        );
      });
      if (matched.length > 0) out[cat] = matched;
    }
    return out;
  }, [resources, categories, query]);

  const filteredCats = Object.keys(filtered);
  const totalShown = Object.values(filtered).reduce((s, items) => s + items.length, 0);

  const handleJump = (cat: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const id = slugify(cat);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-semibold mb-3">
          Jump to
        </div>
        <nav className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-0.5">
          {categories.map((cat) => {
            const id = slugify(cat);
            const visible = !query || filteredCats.includes(cat);
            return (
              <a
                key={cat}
                href={`#${id}`}
                onClick={handleJump(cat)}
                className={
                  "rounded-lg px-3 py-1.5 text-sm transition-colors " +
                  (visible
                    ? "text-[var(--color-fg)] hover:bg-[var(--color-muted)]/60"
                    : "text-[var(--color-muted-fg)]/50 hover:bg-[var(--color-muted)]/30")
                }
              >
                <span className="truncate">{cat}</span>
                <span className="ml-1 text-xs text-[var(--color-muted-fg)]">
                  {resources[cat].length}
                </span>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-fg)]" />
          <input
            aria-label="Search resources"
            name="resources-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all resources…"
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

        {query && (
          <div className="mt-3 text-xs text-[var(--color-muted-fg)]">
            {totalShown === 0
              ? "No matches."
              : `Showing ${totalShown} match${totalShown === 1 ? "" : "es"} across ${filteredCats.length} categor${filteredCats.length === 1 ? "y" : "ies"}.`}
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {filteredCats.map((cat) => (
            <section
              id={slugify(cat)}
              key={cat}
              className="scroll-mt-28 rounded-3xl border border-soft surface p-6"
            >
              <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
                {cat}
              </h2>
              <ul className="mt-4 space-y-1.5">
                {filtered[cat].map((r) => {
                  const Icon = ICON[r.kind];
                  return (
                    <li key={r.url}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-[var(--color-muted)]/50 transition-colors"
                      >
                        <Icon className="h-4 w-4 text-[var(--color-muted-fg)] shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium truncate">{r.title}</span>
                          {r.source && (
                            <span className="block text-xs text-[var(--color-muted-fg)] truncate">
                              {r.source}
                            </span>
                          )}
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-fg)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
