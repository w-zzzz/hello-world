import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Clock, Compass, Flag, ListOrdered, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { CompoundDag } from "@/components/paths/CompoundDag";
import { DifficultyPill } from "@/components/paths/DifficultyPill";
import { PathStep } from "@/components/paths/PathStep";
import {
  PATHS,
  formatHours,
  relatedPaths,
  resolveSteps,
  totalMinutes,
} from "@/lib/paths";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return PATHS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { slug } = await params;
  const path = PATHS.find((p) => p.slug === slug);
  if (!path) return { title: "Path not found" };
  return {
    title: path.title,
    description: path.blurb,
  };
}

export default async function PathDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const path = PATHS.find((p) => p.slug === slug);
  if (!path) notFound();

  const steps = resolveSteps(path);
  const minutes = totalMinutes(path);
  const related = relatedPaths(path, 3);
  const introParagraphs = path.intro.split(/\n\s*\n/);

  return (
    <main className="pt-32 pb-32">
      {/* Hue wash backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[60vh] opacity-40"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${path.hue}, transparent 70%)`,
        }}
      />

      <article className="mx-auto max-w-5xl px-6">
        {/* Breadcrumb */}
        <ScrollReveal>
          <Link
            href="/paths"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium hover:text-[var(--color-fg)] transition-colors"
          >
            <Compass className="h-3.5 w-3.5" aria-hidden />
            All paths
          </Link>
        </ScrollReveal>

        {/* Hero */}
        <header className="mt-6">
          <ScrollReveal>
            <div className="flex items-center gap-2 flex-wrap">
              <DifficultyPill difficulty={path.difficulty} hue={path.hue} />
              <span className="text-xs text-[var(--color-muted-fg)]">·</span>
              <span className="text-xs text-[var(--color-muted-fg)]">{path.duration}</span>
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.04] text-balance">
              {path.title}
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-[var(--color-muted-fg)] leading-relaxed text-pretty max-w-3xl">
              {path.audience}
            </p>
          </ScrollReveal>

          {/* Stats strip */}
          <ScrollReveal delay={0.05}>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] rounded-2xl overflow-hidden border border-soft">
              <Stat icon={ListOrdered} label="Steps" value={String(path.steps.length)} />
              <Stat icon={Clock} label="Reading time" value={`~${formatHours(minutes)}`} />
              <Stat icon={Sparkles} label="Cadence" value={path.duration} />
              <Stat
                icon={Flag}
                label="Capstone"
                value={path.capstone ? "Yes" : "—"}
              />
            </div>
          </ScrollReveal>
        </header>

        {/* Intro paragraphs */}
        <ScrollReveal delay={0.05}>
          <div className="mt-14 max-w-3xl space-y-5 text-[var(--color-fg)]/90 text-base sm:text-lg leading-relaxed text-pretty">
            {introParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </ScrollReveal>

        {/* Compound DAG */}
        <ScrollReveal delay={0.05}>
          <section className="mt-16">
            <CompoundDag path={path} />
          </section>
        </ScrollReveal>

        {/* Progression bar */}
        <ScrollReveal delay={0.05}>
          <section className="mt-16">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
              <span>Step 01</span>
              <span>Step {String(path.steps.length).padStart(2, "0")}</span>
            </div>
            <div className="mt-3 flex h-2 w-full gap-[3px] overflow-hidden rounded-full">
              {steps.map((s, i) => (
                <div
                  key={s.topicSlug}
                  className="h-full flex-1 rounded-sm"
                  title={`${i + 1}. ${s.topic.title}`}
                  style={{
                    background: `linear-gradient(135deg, var(${s.part.hueVar}), color-mix(in oklch, ${path.hue}, var(${s.part.hueVar}) 50%))`,
                    opacity: 0.55 + (i / Math.max(1, steps.length - 1)) * 0.45,
                  }}
                />
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* Steps */}
        <section className="mt-16">
          <ScrollReveal>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
              The path
            </div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
              {path.steps.length} steps, in order.
            </h2>
          </ScrollReveal>

          <ol className="mt-10 space-y-10">
            {steps.map((step) => (
              <ScrollReveal key={step.topicSlug} delay={0}>
                <PathStep step={step} total={steps.length} hue={path.hue} />
              </ScrollReveal>
            ))}
          </ol>
        </section>

        {/* Capstone */}
        {path.capstone && (
          <ScrollReveal>
            <section className="mt-20 relative overflow-hidden rounded-3xl border border-soft surface p-8 sm:p-12">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background: `radial-gradient(ellipse 70% 60% at 100% 0%, ${path.hue}, transparent 60%), radial-gradient(ellipse 60% 60% at 0% 100%, color-mix(in oklch, ${path.hue}, transparent 40%), transparent 60%)`,
                }}
              />
              <div className="relative">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
                  <Flag className="h-3.5 w-3.5" aria-hidden />
                  Capstone
                </div>
                <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight leading-snug text-balance">
                  Prove you walked the path.
                </h2>
                <p className="mt-5 max-w-2xl text-[var(--color-fg)]/90 leading-relaxed text-pretty text-base sm:text-lg">
                  {path.capstone}
                </p>
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* Related paths */}
        {related.length > 0 && (
          <ScrollReveal>
            <section className="mt-24">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
                If you finished this
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
                Try one of these next.
              </h2>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/paths/${p.slug}`}
                    className="group block rounded-2xl border border-soft surface p-5 hover:border-[var(--color-accent)]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <DifficultyPill difficulty={p.difficulty} hue={p.hue} />
                      <ArrowUpRight className="h-4 w-4 text-[var(--color-muted-fg)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                    <div className="mt-4 text-base font-semibold tracking-tight text-balance">
                      {p.title}
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-muted-fg)] leading-relaxed line-clamp-2">
                      {p.blurb}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* CTA: jump in */}
        <ScrollReveal>
          <section className="mt-24 text-center">
            <Link
              href={`/learn/${steps[0].topic.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] px-7 py-3.5 text-base font-medium hover:scale-[1.02] transition-transform"
            >
              Begin step 1: {steps[0].topic.title}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </ScrollReveal>
      </article>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="surface px-5 py-4">
      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}
