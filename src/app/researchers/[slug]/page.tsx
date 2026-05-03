import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import { RESEARCHERS, RESEARCHER_BY_SLUG } from "../../../../content/researchers";
import { TOPICS } from "../../../../content/curriculum";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { StoryBlock } from "@/components/researcher/StoryBlock";
import { STORIES } from "../../../../content/stories";

export function generateStaticParams() {
  return RESEARCHERS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = RESEARCHER_BY_SLUG[slug];
  if (!r) return { title: "Researcher not found" };
  return {
    title: r.name,
    description: r.short,
  };
}

export default async function ResearcherPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = RESEARCHER_BY_SLUG[slug];
  if (!r) notFound();

  // topics that feature this researcher
  const featured = TOPICS.filter((t) => t.researchers.includes(r.slug));
  // paper origin stories that mention this researcher
  const featuredStories = STORIES.filter((s) =>
    (s.researcherSlugs ?? []).includes(r.slug)
  );

  return (
    <main className="pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-6">
        <Link
          href="/researchers"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All researchers
        </Link>

        <header className="mt-6 flex items-center gap-6 flex-wrap">
          <Avatar name={r.name} />
          <div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">{r.name}</h1>
            <div className="mt-2 text-base text-[var(--color-muted-fg)]">{r.affiliation}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.area.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-[var(--color-muted)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-fg)]"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </header>

        <ScrollReveal>
          <p className="mt-10 text-xl text-[var(--color-fg)] leading-relaxed text-balance">
            {r.short}
          </p>
          <p className="mt-4 text-[17px] text-[var(--color-muted-fg)] leading-relaxed text-pretty">
            {r.bio}
          </p>
        </ScrollReveal>

        {r.keyPapers.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
              Key papers
            </h2>
            <ul className="mt-4 space-y-2">
              {r.keyPapers.map((p) => (
                <li key={p.url}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-3 rounded-2xl border border-soft surface p-4 hover:border-[var(--color-accent)]/40 transition-colors"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--color-muted)] text-[var(--color-accent)]">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium leading-tight">{p.title}</div>
                      <div className="text-xs text-[var(--color-muted-fg)] mt-0.5">{p.year}</div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--color-muted-fg)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {r.links.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
              Links
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-soft px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-muted)] transition-colors"
                >
                  {l.label}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              ))}
            </div>
          </section>
        )}

        {r.story && <StoryBlock story={r.story} />}

        {featuredStories.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
              Origin stories
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {featuredStories.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/stories/${s.slug}`}
                    className="block rounded-2xl border border-soft surface p-4 hover:border-[var(--color-accent)]/40 transition-colors"
                  >
                    <div className="text-xs text-[var(--color-muted-fg)]">{s.year}</div>
                    <div className="mt-1 text-sm font-medium leading-tight">{s.title}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {featured.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
              Featured in
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {featured.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/learn/${t.slug}`}
                    className="block rounded-2xl border border-soft surface p-4 hover:border-[var(--color-accent)]/40 transition-colors"
                  >
                    <div className="text-sm font-medium leading-tight">{t.title}</div>
                    <div className="text-xs text-[var(--color-muted-fg)] mt-1 line-clamp-1">{t.hook}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return (
    <div
      className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl text-2xl font-semibold text-white"
      style={{
        background: `linear-gradient(135deg, oklch(0.65 0.16 ${h}), oklch(0.55 0.18 ${(h + 60) % 360}))`,
      }}
    >
      {initials}
    </div>
  );
}
