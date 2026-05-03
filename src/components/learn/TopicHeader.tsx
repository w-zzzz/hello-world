import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";
import type { TopicMeta } from "@/lib/types";
import { PART_BY_SLUG } from "../../../content/curriculum";
import { FavoriteButton } from "@/components/learn/FavoriteButton";
import { ReadingTime } from "@/components/learn/ReadingTime";
import { ShareLink } from "@/components/learn/ShareLink";

export function TopicHeader({
  topic,
  readingMinutes,
}: {
  topic: TopicMeta;
  readingMinutes?: number;
}) {
  const part = PART_BY_SLUG[topic.partSlug];
  return (
    <header className="border-b border-soft pb-10">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/map?focus=${part.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {part.title}
        </Link>
        <div className="flex items-center gap-2">
          <ShareLink slug={topic.slug} title={topic.title} />
          <FavoriteButton slug={topic.slug} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span
          className="grid h-7 px-2.5 place-items-center rounded-md text-xs font-semibold tabular-nums"
          style={{
            backgroundColor: `var(${part.hueVar})`,
            color: `var(${part.hueVar}-fg)`,
          }}
        >
          {String(part.index).padStart(2, "0")}.{String(topic.topicIndex).padStart(2, "0")}
        </span>
        <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)]">
          {part.short}
        </span>
        <span className="ml-2 inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-fg)]">
          <Clock className="h-3 w-3" />
          {topic.estMinutes} min lesson
        </span>
        {readingMinutes !== undefined && readingMinutes !== topic.estMinutes && (
          <ReadingTime minutes={readingMinutes} />
        )}
        <span className="text-xs text-[var(--color-muted-fg)]">·</span>
        <span className="text-xs text-[var(--color-muted-fg)]">
          difficulty {"●".repeat(topic.difficulty)}
          <span className="opacity-30">{"●".repeat(5 - topic.difficulty)}</span>
        </span>
      </div>
      <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
        {topic.title}
      </h1>
      <p className="mt-4 text-lg text-[var(--color-muted-fg)] max-w-2xl text-pretty">
        {topic.hook}
      </p>
    </header>
  );
}
