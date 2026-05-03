"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { PathCard } from "./PathCard";
import {
  type Difficulty,
  type LearningPath,
  difficultyRank,
  sortByDifficulty,
} from "@/lib/paths";

const FILTERS: Array<{ key: "all" | Difficulty; label: string }> = [
  { key: "all", label: "All" },
  { key: "introductory", label: "Introductory" },
  { key: "intermediate", label: "Intermediate" },
  { key: "advanced", label: "Advanced" },
  { key: "frontier", label: "Frontier" },
];

export function PathsFilter({ paths }: { paths: LearningPath[] }) {
  const [filter, setFilter] = React.useState<"all" | Difficulty>("all");

  const visible = React.useMemo(() => {
    const sorted = sortByDifficulty(paths);
    if (filter === "all") return sorted;
    return sorted.filter((p) => p.difficulty === filter);
  }, [paths, filter]);

  return (
    <>
      <div className="mt-12 flex items-center gap-2 flex-wrap" role="tablist" aria-label="Filter by difficulty">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.key)}
              className={
                "relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 " +
                (active
                  ? "text-[var(--color-bg)]"
                  : "text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]")
              }
            >
              {active && (
                <motion.span
                  layoutId="pathsFilterPill"
                  transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute inset-0 rounded-full bg-[var(--color-fg)]"
                />
              )}
              <span className="relative">{f.label}</span>
            </button>
          );
        })}
        <span className="ml-auto text-xs text-[var(--color-muted-fg)] tabular-nums">
          {visible.length} {visible.length === 1 ? "path" : "paths"}
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        <motion.ul
          key={filter}
          className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        >
          {visible.map((p) => (
            <motion.li
              key={p.slug}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: difficultyRank(p.difficulty) * 0.04,
                ease: [0.32, 0.72, 0, 1],
              }}
            >
              <PathCard path={p} />
            </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </>
  );
}
