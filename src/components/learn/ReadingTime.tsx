import { BookOpen } from "lucide-react";

export { estimateReadingMinutes } from "@/lib/reading-time";

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
