"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CurriculumGraph } from "@/components/map/CurriculumGraph";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { PARTS, TOPICS, topicsInPart } from "../../../content/curriculum";

function MapInner() {
  const sp = useSearchParams();
  const focus = sp.get("focus") ?? undefined;
  return (
    <main className="pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
                The whole map
              </div>
              <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
                {TOPICS.length} topics. 11 parts.
                <br />
                <span className="text-[var(--color-muted-fg)]">Click anywhere.</span>
              </h1>
            </div>
            <p className="text-sm text-[var(--color-muted-fg)] max-w-md">
              Drag to pan, scroll to zoom. Hover a node for a preview, click to enter the topic.
              Larger glow indicates a hero interactive. The ring around each node shows your
              mastery on its quizzes.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="mt-10">
          <div className="relative">
            <CurriculumGraph focus={focus} />
          </div>
        </ScrollReveal>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/map"
            className="rounded-full border border-soft px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-muted)] transition-colors"
          >
            All parts
          </Link>
          {PARTS.map((p) => (
            <Link
              key={p.slug}
              href={`/map?focus=${p.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-soft px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-muted)] transition-colors"
              style={focus === p.slug ? { backgroundColor: `color-mix(in oklch, var(${p.hueVar}), var(--color-bg) 88%)`, borderColor: `var(${p.hueVar})` } : undefined}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `var(${p.hueVar})` }} />
              {p.short}
            </Link>
          ))}
        </div>

        <ScrollReveal delay={0.15} className="mt-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PARTS.map((p) => {
              const ts = topicsInPart(p.slug);
              return (
                <div key={p.slug} className="rounded-2xl border border-soft surface p-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold tabular-nums text-white"
                      style={{ backgroundColor: `var(${p.hueVar})` }}
                    >
                      {String(p.index).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{p.title}</div>
                      <div className="text-xs text-[var(--color-muted-fg)]">{p.blurb}</div>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {ts.map((t) => (
                      <li key={t.slug}>
                        <Link
                          href={`/learn/${t.slug}`}
                          className="group flex items-center gap-2 text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-colors"
                        >
                          <span className="text-[10px] tabular-nums opacity-50 group-hover:opacity-100">
                            {String(t.topicIndex).padStart(2, "0")}
                          </span>
                          <span className="truncate">{t.title}</span>
                          {t.hasHeroViz && (
                            <span
                              className="ml-auto h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: `var(${p.hueVar})` }}
                              title="Hero visualization"
                            />
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="pt-40 text-center text-[var(--color-muted-fg)]">Loading…</div>}>
      <MapInner />
    </Suspense>
  );
}
