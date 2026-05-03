import type { Metadata } from "next";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { StoryCard } from "@/components/researcher/StoryCard";
import { STORIES, ERA_ORDER } from "../../../content/stories";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "How modern AI was actually built — paper by paper. Origin stories of the landmark papers behind every major idea in the field.",
};

export default function StoriesPage() {
  // group by era
  const byEra = new Map<string, typeof STORIES>();
  for (const s of STORIES) {
    if (!byEra.has(s.era)) byEra.set(s.era, []);
    byEra.get(s.era)!.push(s);
  }
  // sort within era by year
  for (const arr of byEra.values()) arr.sort((a, b) => a.year - b.year);
  // sort eras by canonical order
  const orderedEras = Array.from(byEra.keys()).sort((a, b) => {
    const ai = ERA_ORDER.indexOf(a);
    const bi = ERA_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <main className="pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
            Origin stories
          </div>
          <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
            How modern AI was actually built — paper by paper.
          </h1>
          <p className="mt-4 text-lg text-[var(--color-muted-fg)] max-w-2xl text-pretty">
            Behind every model on this map is a story: who took the idea
            seriously, when, against what consensus. {STORIES.length} of the
            field&apos;s landmark papers, told as the human history they actually were.
          </p>
        </ScrollReveal>

        {orderedEras.map((era, i) => {
          const items = byEra.get(era)!;
          return (
            <section key={era} className="mt-16">
              <ScrollReveal delay={i * 0.04}>
                <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{era}</h2>
                  <span className="text-xs text-[var(--color-muted-fg)] tabular-nums">
                    {items.length} {items.length === 1 ? "story" : "stories"}
                  </span>
                </div>
              </ScrollReveal>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map((s, j) => (
                  <ScrollReveal key={s.slug} delay={j * 0.02}>
                    <StoryCard story={s} />
                  </ScrollReveal>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
