import type { Metadata } from "next";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { RESOURCES } from "../../../content/resources";
import { ResourcesExplorer } from "./ResourcesExplorer";

export const metadata: Metadata = {
  title: "Resources",
  description: "Curated reading lists, courses, blogs, podcasts, datasets, and Hugging Face starting points.",
};

export default function ResourcesPage() {
  const totalCount = Object.values(RESOURCES).reduce((s, items) => s + items.length, 0);
  const categoryCount = Object.keys(RESOURCES).length;

  return (
    <main className="pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
            Curated reading
          </div>
          <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
            Where to go next.
          </h1>
          <p className="mt-4 text-lg text-[var(--color-muted-fg)] max-w-2xl text-pretty">
            {totalCount} hand-picked items across {categoryCount} categories — textbooks,
            courses, podcasts, newsletters, YouTube channels, frontier papers, datasets,
            and the Hugging Face checkpoints to start tinkering with this afternoon.
          </p>
        </ScrollReveal>

        <ResourcesExplorer resources={RESOURCES} />
      </div>
    </main>
  );
}
