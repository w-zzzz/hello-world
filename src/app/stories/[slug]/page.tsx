import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { STORIES, STORY_BY_SLUG } from "../../../../content/stories";
import { TOPIC_BY_SLUG } from "../../../../content/curriculum";
import { RESEARCHER_BY_SLUG } from "../../../../content/researchers";

export function generateStaticParams() {
  return STORIES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = STORY_BY_SLUG[slug];
  if (!s) return { title: "Story not found" };
  return {
    title: `${s.title} (${s.year})`,
    description: s.headline,
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = STORY_BY_SLUG[slug];
  if (!s) notFound();

  // pick a "next story" — same era preferred, otherwise next overall
  const sameEra = STORIES.filter((x) => x.era === s.era && x.slug !== s.slug);
  const idx = STORIES.findIndex((x) => x.slug === s.slug);
  const next =
    sameEra[0] ?? STORIES[(idx + 1) % STORIES.length];

  return (
    <main className="pt-32 pb-24">
      <article className="mx-auto max-w-3xl px-6">
        <Link
          href="/stories"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All stories
        </Link>

        <header className="mt-6">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
            {s.year} · {s.era}
          </div>
          <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
            {s.title}
          </h1>
          <div className="mt-3 text-base text-[var(--color-muted-fg)]">{s.authors}</div>
          <a
            href={s.paperUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-soft px-4 py-2 text-sm font-medium hover:bg-[var(--color-muted)] transition-colors"
          >
            <FileText className="h-4 w-4" />
            Read the original paper
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </header>

        <ScrollReveal>
          <div className="mt-10 rounded-2xl border border-[var(--color-accent)]/30 bg-[color-mix(in_oklch,_var(--color-accent),_var(--color-card)_92%)] p-6">
            <div className="text-[10px] uppercase tracking-[0.18em] font-medium text-[var(--color-accent)]">
              Why it matters
            </div>
            <p className="mt-2 text-[17px] leading-relaxed text-[var(--color-fg)] text-pretty">
              {s.significance}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <h2 className="mt-14 text-2xl sm:text-3xl font-semibold tracking-tight">The headline</h2>
          <p className="mt-3 text-xl leading-snug text-balance text-[var(--color-fg)]">
            {s.headline}
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mt-10 max-w-prose space-y-5">
            {s.story.map((p, i) => (
              <p
                key={i}
                className="text-[17px] leading-[1.85] text-[var(--color-fg)] text-pretty"
              >
                {p}
              </p>
            ))}
          </div>
        </ScrollReveal>

        {s.pullQuote && (
          <ScrollReveal>
            <figure className="mt-12 max-w-2xl border-l-2 border-[var(--color-accent)] pl-6">
              <blockquote className="text-xl sm:text-2xl font-medium leading-snug text-balance">
                “{s.pullQuote.text}”
              </blockquote>
              <figcaption className="mt-3 text-sm text-[var(--color-muted-fg)]">
                — {s.pullQuote.source}
              </figcaption>
            </figure>
          </ScrollReveal>
        )}

        <ScrollReveal>
          <h2 className="mt-14 text-2xl sm:text-3xl font-semibold tracking-tight">Legacy</h2>
          <p className="mt-3 text-[17px] leading-[1.85] text-[var(--color-fg)] text-pretty max-w-prose">
            {s.legacy}
          </p>
        </ScrollReveal>

        {/* Cross-links */}
        {(s.topicSlugs?.length || s.researcherSlugs?.length) && (
          <ScrollReveal>
            <div className="mt-14 grid gap-5 sm:grid-cols-2">
              {s.topicSlugs && s.topicSlugs.length > 0 && (
                <div className="rounded-2xl border border-soft surface p-5">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
                    Related topics
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {s.topicSlugs.map((slug) => {
                      const t = TOPIC_BY_SLUG[slug];
                      if (!t) return null;
                      return (
                        <li key={slug}>
                          <Link
                            href={`/learn/${slug}`}
                            className="text-sm text-[var(--color-fg)] hover:text-[var(--color-accent)] transition-colors"
                          >
                            {t.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {s.researcherSlugs && s.researcherSlugs.length > 0 && (
                <div className="rounded-2xl border border-soft surface p-5">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
                    Researchers
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {s.researcherSlugs.map((slug) => {
                      const r = RESEARCHER_BY_SLUG[slug];
                      if (!r) return null;
                      return (
                        <li key={slug}>
                          <Link
                            href={`/researchers/${slug}`}
                            className="text-sm text-[var(--color-fg)] hover:text-[var(--color-accent)] transition-colors"
                          >
                            {r.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Next story */}
        <ScrollReveal>
          <Link
            href={`/stories/${next.slug}`}
            className="group mt-16 block rounded-2xl border border-soft surface p-5 hover:border-[var(--color-accent)]/40 transition-colors"
          >
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
              Next story
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span>
                <span className="text-base font-semibold leading-tight">{next.title}</span>
                <span className="block text-xs text-[var(--color-muted-fg)] mt-0.5">
                  {next.authors} · {next.year}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-[var(--color-muted-fg)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>
        </ScrollReveal>
      </article>
    </main>
  );
}
