import { BookOpen } from "lucide-react";

/** Average adult reading speed: ~225 wpm. We use 220 to be slightly conservative
 *  for technical material, and clamp to a sensible floor. */
export function estimateReadingMinutes(content: string): number {
  // Strip code fences, math, html-ish tags, and frontmatter-style noise so the
  // word count better reflects body prose.
  const cleaned = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$\n]+\$/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`~|]/g, " ");
  const words = cleaned.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function ReadingTime({ minutes }: { minutes: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-soft px-2.5 py-0.5 text-xs text-[var(--color-muted-fg)]"
      title={`Approx. ${minutes} minute read at 220 wpm`}
    >
      <BookOpen className="h-3 w-3" />
      <span className="tabular-nums">{minutes}</span>
      <span>min read</span>
    </span>
  );
}
