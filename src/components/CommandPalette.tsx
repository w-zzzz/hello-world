"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Hash,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TOPICS, PART_BY_SLUG } from "../../content/curriculum";
import { RESEARCHERS } from "../../content/researchers";
import type { VizKey } from "@/lib/types";

type Item = {
  id: string;
  group: "Topics" | "Researchers" | "Visualizations";
  title: string;
  subtitle?: string;
  href: string;
  hint?: string;
  haystack: string;
};

const VIZ_LIST: { key: VizKey; title: string; subtitle: string }[] = [
  { key: "gradient-descent", title: "Gradient descent", subtitle: "Walk down a non-convex hill" },
  { key: "nn-playground", title: "Neural network playground", subtitle: "Build a small MLP, watch it train" },
  { key: "attention-heatmap", title: "Attention heatmap", subtitle: "Q·Kᵀ for the curious" },
  { key: "diffusion-denoise", title: "Diffusion denoise", subtitle: "Scrub through a sampling trajectory" },
  { key: "embedding-explorer-3d", title: "3D embedding explorer", subtitle: "Fly through a word cloud" },
  { key: "tokenizer", title: "Tokenizer", subtitle: "BPE step by step" },
  { key: "backprop-stepper", title: "Backprop stepper", subtitle: "Chain rule, one node at a time" },
  { key: "transformer-3d", title: "Transformer 3D", subtitle: "Layer-by-layer walkthrough" },
  { key: "pca-projector", title: "PCA projector", subtitle: "Principal directions in motion" },
  { key: "kernel-trick", title: "Kernel trick", subtitle: "RBF lifts a 2D blob into separability" },
  { key: "moe-router", title: "MoE router", subtitle: "Top-k expert dispatch in flight" },
  { key: "rl-gridworld", title: "RL gridworld", subtitle: "Q-values converge under SARSA" },
];

function buildItems(): Item[] {
  const topics: Item[] = TOPICS.map((t) => {
    const part = PART_BY_SLUG[t.partSlug];
    return {
      id: `topic:${t.slug}`,
      group: "Topics",
      title: t.title,
      subtitle: `${part.short} · ${t.hook}`,
      href: `/learn/${t.slug}`,
      hint: `Part ${part.index}`,
      haystack: `${t.title} ${t.hook} ${part.title} ${part.short}`.toLowerCase(),
    };
  });
  const researchers: Item[] = RESEARCHERS.map((r) => ({
    id: `r:${r.slug}`,
    group: "Researchers",
    title: r.name,
    subtitle: r.affiliation,
    href: `/researchers#${r.slug}`,
    hint: r.area[0] ?? "researcher",
    haystack: `${r.name} ${r.affiliation} ${r.short} ${r.area.join(" ")}`.toLowerCase(),
  }));
  const viz: Item[] = VIZ_LIST.map((v) => ({
    id: `viz:${v.key}`,
    group: "Visualizations",
    title: v.title,
    subtitle: v.subtitle,
    href: `/playground/${v.key}`,
    hint: "playground",
    haystack: `${v.title} ${v.subtitle}`.toLowerCase(),
  }));
  return [...topics, ...researchers, ...viz];
}

function score(item: Item, q: string): number {
  if (!q) return 1; // everything ranks equal when no query
  const t = item.title.toLowerCase();
  if (t === q) return 1000;
  if (t.startsWith(q)) return 500;
  if (t.includes(q)) return 200;
  if (item.haystack.includes(q)) return 50;
  // fuzzy: every char must appear in order
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) i++;
    if (i === q.length) return 10;
  }
  return 0;
}

const GROUP_ICONS: Record<Item["group"], React.ComponentType<{ className?: string }>> = {
  Topics: BookOpen,
  Researchers: User,
  Visualizations: Sparkles,
};

const GROUP_ORDER: Item["group"][] = ["Topics", "Researchers", "Visualizations"];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState(0);
  const reduce = useReducedMotion();

  const allItems = React.useMemo(() => buildItems(), []);

  // Open via Cmd/Ctrl+K, or "/" when not typing.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);

    const onCustom = () => setOpen(true);
    window.addEventListener("mlmap:open-palette", onCustom as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mlmap:open-palette", onCustom as EventListener);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  const ranked = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const scored = allItems
      .map((it) => ({ it, s: score(it, needle) }))
      .filter(({ s }) => s > 0);
    if (!needle) {
      // Without a query, return a tasteful subset per group.
      const byGroup: Record<Item["group"], Item[]> = {
        Topics: [],
        Researchers: [],
        Visualizations: [],
      };
      for (const { it } of scored) {
        if (byGroup[it.group].length < 6) byGroup[it.group].push(it);
      }
      return [...byGroup.Topics, ...byGroup.Researchers, ...byGroup.Visualizations];
    }
    scored.sort((a, b) => b.s - a.s);
    return scored.slice(0, 30).map((x) => x.it);
  }, [q, allItems]);

  // Reset the active row when the result list changes.
  React.useEffect(() => {
    setActive(0);
  }, [q]);

  const grouped = React.useMemo(() => {
    const map = new Map<Item["group"], Item[]>();
    for (const it of ranked) {
      const arr = map.get(it.group) ?? [];
      arr.push(it);
      map.set(it.group, arr);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
      group: g,
      items: map.get(g)!,
    }));
  }, [ranked]);

  const flat = ranked;

  const go = (it: Item) => {
    setOpen(false);
    router.push(it.href);
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = flat[active];
      if (it) go(it);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.18 }}
                  className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.99 }}
                  transition={{ duration: reduce ? 0 : 0.2, ease: [0.32, 0.72, 0, 1] }}
                  className={cn(
                    "fixed left-1/2 top-[12vh] z-[70] -translate-x-1/2",
                    "w-[92vw] max-w-2xl rounded-2xl border border-soft surface shadow-2xl shadow-black/30 overflow-hidden"
                  )}
                >
                  <Dialog.Title className="sr-only">Command palette</Dialog.Title>
                  <div className="flex items-center gap-2 px-4 border-b border-soft">
                    <Search className="h-4 w-4 text-[var(--color-muted-fg)] shrink-0" />
                    <input
                      autoFocus
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onKeyDown={onInputKey}
                      placeholder="Search topics, researchers, visualizations…"
                      className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted-fg)]"
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-soft px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-muted-fg)]">
                      Esc
                    </kbd>
                    <Dialog.Close
                      aria-label="Close"
                      className="grid place-items-center h-7 w-7 rounded-md text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] hover:bg-[var(--color-muted)]"
                    >
                      <X className="h-4 w-4" />
                    </Dialog.Close>
                  </div>

                  <div
                    role="listbox"
                    className="max-h-[60vh] overflow-y-auto py-2"
                  >
                    {flat.length === 0 ? (
                      <div className="px-6 py-12 text-center text-sm text-[var(--color-muted-fg)]">
                        No matches.
                      </div>
                    ) : (
                      grouped.map(({ group, items }) => {
                        const Icon = GROUP_ICONS[group];
                        return (
                          <div key={group} className="mb-1">
                            <div className="flex items-center gap-1.5 px-4 pt-2 pb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)]">
                              <Icon className="h-3 w-3" />
                              {group}
                            </div>
                            <ul>
                              {items.map((it) => {
                                const idx = flat.indexOf(it);
                                const isActive = idx === active;
                                return (
                                  <li key={it.id}>
                                    <button
                                      type="button"
                                      role="option"
                                      aria-selected={isActive}
                                      onMouseEnter={() => setActive(idx)}
                                      onClick={() => go(it)}
                                      className={cn(
                                        "w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors",
                                        isActive
                                          ? "bg-[var(--color-muted)] text-[var(--color-fg)]"
                                          : "text-[var(--color-fg)] hover:bg-[var(--color-muted)]/60"
                                      )}
                                    >
                                      <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--color-bg)] border border-soft shrink-0 text-[var(--color-muted-fg)]">
                                        <Hash className="h-3.5 w-3.5" />
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="block font-medium truncate">
                                          {it.title}
                                        </span>
                                        {it.subtitle && (
                                          <span className="block text-xs text-[var(--color-muted-fg)] truncate">
                                            {it.subtitle}
                                          </span>
                                        )}
                                      </span>
                                      {it.hint && (
                                        <span className="hidden sm:inline text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)]">
                                          {it.hint}
                                        </span>
                                      )}
                                      <ArrowRight
                                        className={cn(
                                          "h-3.5 w-3.5 shrink-0 transition-opacity",
                                          isActive ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex items-center gap-3 px-4 py-2 border-t border-soft text-[10px] text-[var(--color-muted-fg)]">
                    <span className="inline-flex items-center gap-1">
                      <kbd className="rounded border border-soft px-1 py-0.5 font-mono">↑</kbd>
                      <kbd className="rounded border border-soft px-1 py-0.5 font-mono">↓</kbd>
                      navigate
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="rounded border border-soft px-1 py-0.5 font-mono">↵</kbd>
                      open
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <kbd className="rounded border border-soft px-1 py-0.5 font-mono">/</kbd>
                      focus search
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1">
                      <kbd className="rounded border border-soft px-1 py-0.5 font-mono">?</kbd>
                      shortcuts
                    </span>
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Programmatic open from anywhere (Nav chip, etc). */
export function openCommandPalette() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("mlmap:open-palette"));
}
