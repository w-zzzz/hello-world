import Link from "next/link";
import { ArrowUpRight, BookOpen, Calendar, Compass, Cpu, GraduationCap, Layers, LineChart, Microscope, Network, Sparkles, Zap } from "lucide-react";
import { Hero } from "@/components/apple/Hero";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { ParallaxLayer } from "@/components/apple/ParallaxLayer";
import { TickerStat } from "@/components/apple/TickerStat";
import { MarqueeRow } from "@/components/apple/MarqueeRow";
import { MagneticButton } from "@/components/apple/MagneticButton";
import { TOPICS, PARTS } from "../../content/curriculum";
import { RESEARCHERS } from "../../content/researchers";

// Counted from the registry in src/components/content/Embed.tsx — kept in sync
// manually because we can't import a "use client" module from this server file.
const VIZ_COUNT = 12;

const parts = [
  { i: 1, slug: "01-math", title: "Math foundations", blurb: "Linear algebra, probability, optimization." },
  { i: 2, slug: "02-classical-ml", title: "Classical ML", blurb: "Regression, SVMs, ensembles, clustering." },
  { i: 3, slug: "03-deep-learning", title: "Deep learning core", blurb: "MLPs, CNNs, RNNs, attention." },
  { i: 4, slug: "04-transformers-llms", title: "Transformers & LLMs", blurb: "GPT, BERT, scaling laws, instruction tuning." },
  { i: 5, slug: "05-reasoning-agents", title: "Reasoning & agents", blurb: "o1/o3/R1, ReAct, MCP, agent frameworks." },
  { i: 6, slug: "06-multimodal", title: "Multimodal", blurb: "CLIP, diffusion, flow matching, video." },
  { i: 7, slug: "07-generative-theory", title: "Generative theory", blurb: "VAEs, GANs, normalizing flows." },
  { i: 8, slug: "08-rl", title: "Reinforcement learning", blurb: "MDPs, PPO, RLHF, AlphaZero." },
  { i: 9, slug: "09-training-infra", title: "Training & infra", blurb: "FSDP, LoRA, quantization, FlashAttention." },
  { i: 10, slug: "10-cutting-edge", title: "Cutting edge", blurb: "MoE, Mamba, mech-interp, RAG, grokking." },
  { i: 11, slug: "11-niche-pivotal", title: "Niche, pivotal", blurb: "NTK, Hyena, geometric DL, neural ODEs, JEPA." },
];

const pillars = [
  {
    icon: Layers,
    title: "Built like a map, not a textbook",
    body: "Topics arranged into a directed prerequisite graph. Open the map; pick where to start; the system tracks what you've mastered and what's next.",
  },
  {
    icon: Microscope,
    title: "Hand-built interactives",
    body: "A dozen flagship visualizations — gradient descent, attention heatmaps, diffusion denoising, a 3D embedding explorer, a transformer walkthrough — designed to make ideas click.",
  },
  {
    icon: Network,
    title: "Frontier-aware",
    body: "Reasoning with test-time compute. Mixture-of-Experts. State-space models. Mechanistic interpretability. JEPA. The 2025–26 landscape — taught with the original papers in hand.",
  },
  {
    icon: GraduationCap,
    title: "Quizzes that stick",
    body: "Each topic has multiple-choice questions with instant explanations. Wrong answers schedule a spaced-repetition review using SuperMemo-2 — your knowledge compounds.",
  },
];

const researchers = [
  "Geoffrey Hinton",
  "Yann LeCun",
  "Yoshua Bengio",
  "Andrew Ng",
  "Andrej Karpathy",
  "Ilya Sutskever",
  "Demis Hassabis",
  "Fei-Fei Li",
  "Tri Dao",
  "Albert Gu",
  "Chris Olah",
  "Neel Nanda",
  "Lilian Weng",
  "Sebastian Raschka",
  "Chelsea Finn",
  "Pieter Abbeel",
  "Sergey Levine",
  "Jeff Dean",
  "Jeremy Howard",
];

export default function Home() {
  const topicCount = TOPICS.length;
  const partCount = PARTS.length;
  const researcherCount = RESEARCHERS.length;
  const paperCount = TOPICS.length * 4; // conservative average; ~180+ across the curriculum
  return (
    <>
      <Hero stats={{ topics: topicCount, interactives: VIZ_COUNT, researchers: researcherCount }} />

      {/* Pillars section */}
      <section className="relative py-32 sm:py-40">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal>
            <div className="max-w-3xl">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
                Why this exists
              </div>
              <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
                A learning map for the field — not a list of YouTube playlists.
              </h2>
              <p className="mt-6 text-lg text-[var(--color-muted-fg)] max-w-2xl text-pretty">
                Reading every paper is impossible. This is the curated trunk and
                branches: the concepts, architectures, and techniques that actually
                matter for PhD-level work, with a clear path through them.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-20 grid gap-px bg-[var(--color-border)] rounded-3xl overflow-hidden border border-soft md:grid-cols-2">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <ScrollReveal key={p.title} delay={i * 0.05} className="surface p-10 md:p-12">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-muted)] text-[var(--color-accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold tracking-tight">{p.title}</h3>
                  <p className="mt-3 text-[var(--color-muted-fg)] leading-relaxed text-pretty">
                    {p.body}
                  </p>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Curriculum overview */}
      <section className="relative py-32 sm:py-40 surface border-y border-soft overflow-hidden">
        <ParallaxLayer
          speed={0.4}
          className="pointer-events-none absolute -top-40 right-[-10%] -z-0 h-[460px] w-[460px] rounded-full bg-gradient-to-br from-[var(--color-part-6)] to-[var(--color-part-7)] opacity-25 blur-3xl"
        >
          <span className="sr-only">decoration</span>
        </ParallaxLayer>

        <div className="mx-auto max-w-7xl px-6 relative">
          <ScrollReveal>
            <div className="flex items-end justify-between gap-8 flex-wrap">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
                  Curriculum
                </div>
                <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
                  {partCount} parts. {topicCount} topics.
                  <br />
                  <span className="text-[var(--color-muted-fg)]">One coherent path.</span>
                </h2>
              </div>
              <Link
                href="/map"
                className="group inline-flex items-center gap-1.5 text-sm font-medium hover:text-[var(--color-accent)] transition-colors"
              >
                See the full map
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </ScrollReveal>

          <ul className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parts.map((p, i) => (
              <ScrollReveal key={p.slug} as="li" delay={i * 0.025}>
                <Link
                  href={`/map?focus=${p.slug}`}
                  className="group block rounded-2xl border border-soft bg-[var(--color-bg)] p-6 hover:border-[var(--color-accent)]/40 hover:shadow-lg hover:shadow-black/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-9 w-9 place-items-center rounded-xl text-xs font-semibold tabular-nums"
                      style={{
                        backgroundColor: `var(--color-part-${p.i})`,
                        color: `var(--color-part-${p.i}-fg)`,
                      }}
                    >
                      {String(p.i).padStart(2, "0")}
                    </span>
                    <span className="text-base font-semibold tracking-tight">{p.title}</span>
                  </div>
                  <p className="mt-3 text-sm text-[var(--color-muted-fg)] leading-relaxed text-pretty">
                    {p.blurb}
                  </p>
                </Link>
              </ScrollReveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Stats */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
                The whole field
              </div>
              <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
                Breadth meets depth.
              </h2>
            </div>
          </ScrollReveal>
          <div className="mt-20 grid gap-12 sm:grid-cols-2 md:grid-cols-4">
            <ScrollReveal delay={0.0}><TickerStat to={topicCount} label="topics" /></ScrollReveal>
            <ScrollReveal delay={0.1}><TickerStat to={VIZ_COUNT} label="interactives" /></ScrollReveal>
            <ScrollReveal delay={0.2}><TickerStat to={researcherCount} label="researchers" /></ScrollReveal>
            <ScrollReveal delay={0.3}><TickerStat to={paperCount} label="papers cited" suffix="+" /></ScrollReveal>
          </div>
        </div>
      </section>

      {/* Researchers marquee */}
      <section className="py-24 border-y border-soft">
        <ScrollReveal className="text-center mx-auto max-w-3xl px-6">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
            With the field&apos;s voices
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
            Pioneers, leaders, and rising stars.
          </h2>
        </ScrollReveal>
        <div className="mt-16">
          <MarqueeRow
            items={researchers.map((name) => (
              <div
                key={name}
                className="rounded-full border border-soft px-5 py-2 text-sm font-medium text-[var(--color-muted-fg)] surface"
              >
                {name}
              </div>
            ))}
          />
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/researchers"
            className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-[var(--color-accent)] transition-colors"
          >
            Browse all researchers
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Visualization preview */}
      <section className="py-32 sm:py-40">
        <div className="mx-auto max-w-7xl px-6 grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
          <ScrollReveal>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
              Visualizations, not just words
            </div>
            <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
              See it. Drag it. Train it.
            </h2>
            <p className="mt-6 text-lg text-[var(--color-muted-fg)] leading-relaxed text-pretty">
              Twelve flagship interactives let you move particles down a loss
              landscape, scrub through diffusion denoising, watch attention
              attend, fly through a 3D word-embedding cloud, and step through
              backprop one node at a time.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "Gradient descent",
                "Neural network playground",
                "Attention heatmap",
                "Diffusion denoise",
                "3D embeddings",
                "Tokenizer",
                "Backprop stepper",
                "Transformer 3D",
              ].map((n) => (
                <span
                  key={n}
                  className="rounded-full border border-soft px-3 py-1 text-xs text-[var(--color-muted-fg)]"
                >
                  {n}
                </span>
              ))}
            </div>
            <div className="mt-10">
              <Link
                href="/playground/gradient-descent"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] px-6 py-3 text-sm font-medium hover:scale-[1.02] transition-transform"
              >
                Open a playground
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="relative aspect-[4/3] rounded-3xl border border-soft overflow-hidden surface shadow-2xl shadow-black/10">
              <div className="absolute inset-0 gradient-mesh opacity-70" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid grid-cols-2 gap-4 p-8 w-full max-w-md">
                  {[
                    { Icon: LineChart, label: "Gradient descent" },
                    { Icon: Network, label: "Attention heads" },
                    { Icon: Sparkles, label: "Diffusion" },
                    { Icon: Cpu, label: "Tokenizer" },
                    { Icon: Layers, label: "Backprop" },
                    { Icon: Zap, label: "Transformer 3D" },
                  ].map(({ Icon, label }) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-[var(--color-bg)]/70 backdrop-blur border border-soft p-4 flex items-center gap-3"
                    >
                      <Icon className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
                      <span className="text-xs font-medium truncate">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)]">
                Preview
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Three new ways in */}
      <section className="py-24 sm:py-32 border-y border-soft surface">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal>
            <div className="max-w-3xl">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
                Three new ways in
              </div>
              <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
                Pick the lens that fits how you think.
              </h2>
              <p className="mt-6 text-lg text-[var(--color-muted-fg)] max-w-2xl text-pretty">
                The same body of knowledge, three different doors. Walk it
                chronologically, follow a guided path, or read the human stories
                behind the breakthroughs.
              </p>
            </div>
          </ScrollReveal>
          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {[
              {
                href: "/timeline",
                Icon: Calendar,
                eyebrow: "1957 — today",
                title: "Timeline",
                body: "From the perceptron to test-time compute. A scrubable history of every architecture and idea on the map.",
                tint: "--color-part-3",
              },
              {
                href: "/paths",
                Icon: Compass,
                eyebrow: "Curated routes",
                title: "Paths",
                body: "Hand-picked sequences for the LLM engineer, the diffusion artist, the RL researcher, the math-first beginner.",
                tint: "--color-part-7",
              },
              {
                href: "/stories",
                Icon: BookOpen,
                eyebrow: "The humans",
                title: "Stories",
                body: "Long-form essays on the people, papers, and debates that shaped a subfield. Start with a researcher; end with a topic.",
                tint: "--color-part-10",
              },
            ].map((c, i) => (
              <ScrollReveal key={c.href} delay={i * 0.05}>
                <Link
                  href={c.href}
                  className="group block h-full rounded-3xl border border-soft bg-[var(--color-bg)] p-7 hover:border-[var(--color-accent)]/40 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="grid h-11 w-11 place-items-center rounded-2xl"
                      style={{
                        backgroundColor: `var(${c.tint})`,
                        color: `var(${c.tint}-fg)`,
                      }}
                    >
                      <c.Icon className="h-5 w-5" />
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[var(--color-muted-fg)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <div className="mt-6 text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
                    {c.eyebrow}
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight">{c.title}</div>
                  <p className="mt-3 text-sm text-[var(--color-muted-fg)] leading-relaxed text-pretty">
                    {c.body}
                  </p>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-32 pt-32">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl border border-soft p-14 sm:p-20 text-center surface">
              <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-60" />
              <div className="relative">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
                  Start where you are.
                  <br />
                  <span className="text-[var(--color-muted-fg)]">Reach the frontier.</span>
                </h2>
                <p className="mt-6 mx-auto max-w-xl text-[var(--color-muted-fg)] leading-relaxed text-pretty">
                  Open the map, pick a topic, take a quiz. The map remembers.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  <MagneticButton href="/map" strength={7}>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] px-7 py-3.5 text-base font-medium transition-shadow duration-300 hover:shadow-2xl">
                      Open the map
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </MagneticButton>
                  <MagneticButton href="/dashboard" strength={5}>
                    <span className="inline-flex items-center gap-2 rounded-full border border-soft px-7 py-3.5 text-base font-medium hover:bg-[var(--color-muted)] transition-colors">
                      Your dashboard
                    </span>
                  </MagneticButton>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
