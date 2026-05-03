import type { Metadata } from "next";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { TimelineExperience } from "@/components/timeline/TimelineExperience";
import { EVENTS, ERAS, timelineSpan } from "@/lib/timeline";

export const metadata: Metadata = {
  title: "Timeline — eight eras of AI",
  description:
    "From McCulloch & Pitts (1943) to Claude 4.7 (2026): a chronological tour of how machine learning compounded into modern AI.",
};

export default function TimelinePage() {
  const span = timelineSpan();

  return (
    <main className="pt-32 pb-32">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
            {span.start}–{span.end} · {span.years} years · {EVENTS.length} events
          </div>
          <h1 className="mt-3 text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[0.95] text-balance">
            The story so far.
          </h1>
          <p className="mt-6 text-lg sm:text-xl max-w-3xl text-[var(--color-muted-fg)] leading-relaxed text-pretty">
            Eight eras, {ERAS.length === 8 ? "from cybernetics to test-time-compute reasoning" : ""}. Every paper,
            model, and milestone here is a stepping stone for the next. Toggle{" "}
            <span className="font-medium text-[var(--color-fg)]">compound arrows</span> to see what built on what.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3 max-w-3xl">
            <Stat n={EVENTS.length} label="events" />
            <Stat n={ERAS.length} label="eras" />
            <Stat n={span.years} label="years" />
          </div>
        </ScrollReveal>
      </section>

      {/* The interactive timeline */}
      <div className="mt-16">
        <TimelineExperience />
      </div>

      {/* Closing note */}
      <section className="mx-auto max-w-3xl px-6 mt-32 text-center">
        <ScrollReveal>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
            And we&apos;re still scrolling
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Every breakthrough on this page rests on the one above it.
          </h2>
          <p className="mt-4 text-[var(--color-muted-fg)] leading-relaxed text-pretty">
            The compounding never stops. Open the map and pick a thread to pull on.
          </p>
        </ScrollReveal>
      </section>
    </main>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-2xl border border-soft px-5 py-4 surface">
      <div className="text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums">
        {n}
      </div>
      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-muted-fg)]">
        {label}
      </div>
    </div>
  );
}
