import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PaperStory } from "@/lib/types";

export function StoryCard({ story }: { story: PaperStory }) {
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group block rounded-2xl border border-soft surface p-6 hover:border-[var(--color-accent)]/40 hover:shadow-md hover:shadow-black/5 transition-all duration-300"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
          {story.year} · {story.era}
        </span>
        <ArrowUpRight className="h-4 w-4 text-[var(--color-muted-fg)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <div className="mt-3 text-lg font-semibold tracking-tight leading-snug">{story.title}</div>
      <div className="mt-1 text-sm text-[var(--color-muted-fg)]">{story.authors}</div>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-fg)] text-pretty">
        {story.headline}
      </p>
    </Link>
  );
}
