import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Compass, Layers, Sparkles, Wrench } from "lucide-react";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { PARTS, TOPICS } from "../../../content/curriculum";
import { RESEARCHERS } from "../../../content/researchers";
import { RESOURCES } from "../../../content/resources";

export const metadata: Metadata = {
  title: "About",
  description:
    "What MLMap is, how it's built, and the philosophy behind the curriculum.",
};

const HERO_VIZ: { key: string; title: string }[] = [
  { key: "gradient-descent", title: "Gradient descent playground" },
  { key: "nn-playground", title: "Neural network playground" },
  { key: "attention-heatmap", title: "Attention head viewer" },
  { key: "diffusion-denoise", title: "Diffusion denoising" },
  { key: "embedding-explorer-3d", title: "Embedding space" },
  { key: "tokenizer", title: "Tokenizer" },
  { key: "backprop-stepper", title: "Backpropagation, step by step" },
  { key: "transformer-3d", title: "Transformer walkthrough" },
];

const STACK = [
  { label: "Framework", value: "Next.js 16 · React 19 · TypeScript" },
  { label: "Styling", value: "Tailwind v4 · Radix primitives" },
  { label: "Content", value: "MDX · KaTeX · rehype-pretty-code (Shiki)" },
  { label: "Visualizations", value: "Canvas 2D · SVG · react-three-fiber" },
  { label: "Persistence", value: "Prisma · SQLite · anonymous session cookie" },
  { label: "Spaced repetition", value: "SuperMemo-2 review queue" },
];

export default function AboutPage() {
  const recentTopics = TOPICS.slice(-5).reverse();

  return (
    <main className="pt-32 pb-24">
      <div className="mx-auto max-w-5xl px-6">
        {/* Hero */}
        <ScrollReveal>
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
            About MLMap
          </div>
          <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
            A map you can actually walk on.
          </h1>
          <p className="mt-6 text-lg text-[var(--color-muted-fg)] max-w-2xl text-pretty leading-relaxed">
            MLMap is an interactive guide to modern machine learning, deep
            learning, and AI — {TOPICS.length} topics organized into a
            prerequisite graph, hand-built visualizations for the load-bearing
            ideas, and a spaced-repetition queue so the things you learn don&apos;t
            evaporate a week later.
          </p>
          <p className="mt-4 text-lg text-[var(--color-muted-fg)] max-w-2xl text-pretty leading-relaxed">
            It exists because the field moves fast, the literature is fragmented,
            and the best way to learn it is by climbing the dependency chain
            from linear algebra to JEPA — not by skimming Twitter threads about
            the latest model.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Topics" value={String(TOPICS.length)} />
          <Stat label="Parts" value={String(PARTS.length)} />
          <Stat label="Researchers" value={String(RESEARCHERS.length)} />
          <Stat label="Hero visualizations" value={String(HERO_VIZ.length)} />
        </div>

        {/* How it's built */}
        <Section icon={Wrench} eyebrow="How it's built" title="The stack">
          <p className="text-[var(--color-muted-fg)] leading-relaxed">
            One Next.js app, server components for content, client components
            for anything interactive, and a single SQLite file for progress.
            Everything is statically rendered where possible; the heavy
            visualizations are dynamically imported so the rest of the page
            stays fast.
          </p>
          <dl className="mt-6 grid sm:grid-cols-2 gap-3">
            {STACK.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-soft surface p-4"
              >
                <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-semibold">
                  {s.label}
                </dt>
                <dd className="mt-1.5 text-sm font-medium">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* Curriculum philosophy */}
        <Section
          icon={Compass}
          eyebrow="Curriculum philosophy"
          title="Why these eleven parts, in this order"
        >
          <p className="text-[var(--color-muted-fg)] leading-relaxed">
            Every topic depends on something before it. We start with the math
            you cannot avoid — linear algebra, probability, optimization — then
            spend a part on classical ML so the inductive biases of trees and
            kernels stay legible. From there the spine is{" "}
            <em>representations → architectures → training → behavior</em>:
            MLPs and CNNs introduce the gradient-flow story, attention rewrites
            sequence modeling, the GPT family scales it, and the modern frontier
            (reasoning models, MoE, SSMs, mech-interp) builds on every layer
            below.
          </p>
          <p className="mt-3 text-[var(--color-muted-fg)] leading-relaxed">
            Reinforcement learning, generative theory, and infrastructure are
            kept as their own parts rather than scattered through the spine —
            their concepts (Bellman equations, ELBO, FSDP) are coherent enough
            to deserve unbroken attention. The final &ldquo;niche but pivotal&rdquo;
            part collects the ideas that don&apos;t fit a tidy lineage but that
            keep showing up: NTK, geometric DL, neural ODEs, JEPA.
          </p>
          <ul className="mt-6 grid sm:grid-cols-2 gap-2">
            {PARTS.map((p) => (
              <li
                key={p.slug}
                className="flex items-baseline gap-3 rounded-xl border border-soft surface px-4 py-3"
              >
                <span className="text-xs font-mono text-[var(--color-muted-fg)] w-6">
                  {String(p.index).padStart(2, "0")}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{p.title}</span>
                  <span className="block text-xs text-[var(--color-muted-fg)]">
                    {p.blurb}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Recently added */}
        <Section
          icon={Sparkles}
          eyebrow="Recently added"
          title="Latest topics in the curriculum"
        >
          <ul className="grid gap-2">
            {recentTopics.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/learn/${t.slug}`}
                  className="group flex items-baseline gap-3 rounded-xl border border-soft surface px-4 py-3 hover:border-[var(--color-accent)]/40 transition-colors"
                >
                  <span className="text-xs font-mono text-[var(--color-muted-fg)] w-14 shrink-0">
                    P{t.partIndex}·{String(t.topicIndex).padStart(2, "0")}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate">
                      {t.title}
                    </span>
                    <span className="block text-xs text-[var(--color-muted-fg)] truncate">
                      {t.hook}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--color-muted-fg)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        {/* Credits */}
        <Section icon={Layers} eyebrow="Credits" title="What's inside">
          <div className="grid gap-6 lg:grid-cols-3">
            <CreditsCard
              title={`${HERO_VIZ.length} hero visualizations`}
              caption="Hand-built canvas, SVG, and three.js interactives."
              cta={{ label: "Open the playground", href: "/playground/gradient-descent" }}
            >
              <ul className="mt-3 space-y-1 text-sm">
                {HERO_VIZ.map((v) => (
                  <li key={v.key}>
                    <Link
                      href={`/playground/${v.key}`}
                      className="text-[var(--color-muted-fg)] hover:text-[var(--color-accent)] hover:underline"
                    >
                      {v.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </CreditsCard>

            <CreditsCard
              title={`${RESEARCHERS.length} researchers`}
              caption="Pioneers, current frontier-lab leaders, and the active voices shaping each subfield."
              cta={{ label: "Browse researchers", href: "/researchers" }}
            >
              <p className="mt-3 text-xs text-[var(--color-muted-fg)] leading-relaxed">
                Each topic page links the researchers behind the load-bearing
                ideas. Filter by area on the researchers index.
              </p>
            </CreditsCard>

            <CreditsCard
              title={`${Object.keys(RESOURCES).length} resource categories`}
              caption="Textbooks, courses, podcasts, newsletters, papers, datasets, and HF starting points."
              cta={{ label: "Open resources", href: "/resources" }}
            >
              <ul className="mt-3 space-y-1 text-sm">
                {Object.keys(RESOURCES).map((cat) => (
                  <li key={cat} className="text-[var(--color-muted-fg)]">
                    {cat}{" "}
                    <span className="text-[var(--color-muted-fg)]">
                      ({RESOURCES[cat].length})
                    </span>
                  </li>
                ))}
              </ul>
            </CreditsCard>
          </div>
        </Section>

        {/* Closing */}
        <ScrollReveal>
          <div className="mt-24 rounded-3xl border border-soft surface p-8 text-center">
            <p className="text-[var(--color-muted-fg)] leading-relaxed text-pretty">
              Spotted a missing paper, a broken link, or a researcher who
              deserves to be on the wall? Open an issue. The whole curriculum is{" "}
              <code className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 text-xs">
                content/curriculum.ts
              </code>{" "}
              — one file, one source of truth.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
              <Link
                href="/map"
                className="rounded-full border border-soft surface px-5 py-2 hover:border-[var(--color-accent)]/40"
              >
                See the map
              </Link>
              <Link
                href="/learn/01-math/01-linear-algebra"
                className="rounded-full bg-[var(--color-accent)] px-5 py-2 text-white"
              >
                Start with linear algebra
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-soft surface p-4 text-center">
      <div className="text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-semibold">
        {label}
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollReveal>
      <section className="mt-24">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
          <Icon className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
          {title}
        </h2>
        <div className="mt-6">{children}</div>
      </section>
    </ScrollReveal>
  );
}

function CreditsCard({
  title,
  caption,
  cta,
  children,
}: {
  title: string;
  caption: string;
  cta: { label: string; href: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-soft surface p-5">
      <div className="text-base font-semibold">{title}</div>
      <p className="mt-1 text-xs text-[var(--color-muted-fg)] leading-relaxed">
        {caption}
      </p>
      {children}
      <Link
        href={cta.href}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:underline"
      >
        {cta.label}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
