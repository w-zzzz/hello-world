import type { Metadata } from "next";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { PathsFilter } from "@/components/paths/PathsFilter";
import { PATHS } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Paths",
  description:
    "Curated reading orders through the curriculum — from PhD onboarding to the 2025-26 frontier.",
};

export default function PathsPage() {
  const totalSteps = PATHS.reduce((acc, p) => acc + p.steps.length, 0);
  return (
    <main className="pt-32 pb-32">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
            Curated routes
          </div>
          <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
            A path through the field.
          </h1>
          <p className="mt-6 text-lg text-[var(--color-muted-fg)] max-w-2xl text-pretty leading-relaxed">
            The map shows you everything. A path tells you what to read first,
            what to read next, and — crucially — why. {PATHS.length} hand-curated
            sequences across {totalSteps} steps, opinionated about order and pacing.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <PathsFilter paths={PATHS} />
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <section className="mt-24 rounded-3xl border border-soft surface p-8 sm:p-12 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-50" />
            <div className="relative max-w-3xl">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
                How to read a path
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight leading-snug text-balance">
                Order matters more than coverage.
              </h2>
              <p className="mt-4 text-[var(--color-muted-fg)] leading-relaxed text-pretty">
                Every step on every path links to a real topic in the curriculum,
                with a one-paragraph note on why it appears here, in this position.
                The compound DAG at the top of each path shows how its ideas build
                on each other — solid arrows are the reading order; dashed arrows
                are real prerequisite dependencies between topics on the path.
              </p>
              <p className="mt-3 text-[var(--color-muted-fg)] leading-relaxed text-pretty">
                You don&apos;t have to start at step one. The dashboard remembers
                what you&apos;ve already mastered; the path is a recommendation,
                not a wall.
              </p>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </main>
  );
}
