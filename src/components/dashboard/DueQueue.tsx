"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import { Clock4, ArrowUpRight } from "lucide-react";
import { TOPIC_BY_SLUG } from "../../../content/curriculum";

const fetcher = (url: string) => fetch(url, { credentials: "same-origin" }).then((r) => r.json());

type Item = {
  id: string;
  topicSlug: string;
  questionId: string;
  dueAt: string;
  repetitions: number;
};

export function DueQueue() {
  const { data } = useSWR<{ items: Item[] }>("/api/review", fetcher, { revalidateOnFocus: false });
  const items = data?.items ?? [];
  return (
    <div className="rounded-3xl border border-soft surface p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
            Due for review
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
            {items.length}
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-fg)]">
          <Clock4 className="h-3.5 w-3.5" />
          SuperMemo-2
        </div>
      </div>
      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-soft p-5 text-sm text-[var(--color-muted-fg)] text-center">
          Nothing due. Take a quiz to seed your queue.
        </div>
      ) : (
        <ul className="mt-5 space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-none">
          {items.map((it) => {
            const topic = TOPIC_BY_SLUG[it.topicSlug];
            return (
              <li key={it.id}>
                <Link
                  href={`/learn/${it.topicSlug}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-soft bg-[var(--color-bg)] px-4 py-2.5 hover:border-[var(--color-accent)]/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium truncate">
                      {topic?.title ?? it.topicSlug}
                    </span>
                    <span className="block text-[11px] text-[var(--color-muted-fg)] tabular-nums">
                      rep {it.repetitions} · {it.questionId}
                    </span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-fg)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
