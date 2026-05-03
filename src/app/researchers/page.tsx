import type { Metadata } from "next";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { ResearchersExplorer } from "@/components/researcher/ResearchersExplorer";
import { RESEARCHERS } from "../../../content/researchers";

export const metadata: Metadata = {
  title: "Researchers",
  description: "Pioneers and active leaders shaping modern machine learning, deep learning, and AI.",
};

export default function ResearchersPage() {
  return (
    <main className="pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
            With the field&apos;s voices
          </div>
          <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
            {RESEARCHERS.length} researchers worth following.
          </h1>
          <p className="mt-4 text-lg text-[var(--color-muted-fg)] max-w-2xl text-pretty">
            Pioneers, current leaders, and the rising voices behind today&apos;s
            architectures, alignment, interpretability, infrastructure, and
            generative theory. Filter by area or search for someone you have in mind.
          </p>
        </ScrollReveal>

        <ResearchersExplorer researchers={RESEARCHERS} />
      </div>
    </main>
  );
}
