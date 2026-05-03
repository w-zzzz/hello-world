import type { Researcher } from "@/lib/types";

export function StoryBlock({ story }: { story: NonNullable<Researcher["story"]> }) {
  return (
    <section className="mt-16 border-t border-soft pt-14">
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
        The story
      </div>
      <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1] text-balance max-w-3xl">
        {story.headline}
      </h2>
      <div className="mt-8 max-w-prose space-y-5">
        {story.paragraphs.map((p, i) => (
          <p
            key={i}
            className="text-[17px] leading-[1.85] text-[var(--color-fg)] text-pretty"
          >
            {p}
          </p>
        ))}
      </div>
      {story.pullQuote && (
        <figure className="mt-10 max-w-2xl border-l-2 border-[var(--color-accent)] pl-6">
          <blockquote className="text-xl sm:text-2xl font-medium leading-snug text-balance">
            “{story.pullQuote.text}”
          </blockquote>
          <figcaption className="mt-3 text-sm text-[var(--color-muted-fg)]">
            — {story.pullQuote.source}
          </figcaption>
        </figure>
      )}
    </section>
  );
}
