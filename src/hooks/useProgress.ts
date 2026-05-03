"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { credentials: "same-origin" }).then((r) => r.json());

export type ProgressRow = {
  id: string;
  userId: string;
  topicSlug: string;
  status: "not_started" | "in_progress" | "completed";
  mastery: number;
  scrollDepth: number;
  completedAt: string | null;
  updatedAt: string;
};

export function useTopicProgress(slug: string) {
  const { data, mutate } = useSWR<{ progress: ProgressRow | null }>(`/api/progress?slug=${encodeURIComponent(slug)}`, fetcher, {
    revalidateOnFocus: false,
  });
  return { progress: data?.progress ?? null, mutate };
}

export function useAllProgress() {
  const { data, mutate } = useSWR<{ progress: ProgressRow[] }>(`/api/progress`, fetcher, {
    revalidateOnFocus: false,
  });
  return { progress: data?.progress ?? [], mutate };
}

export async function patchProgress(
  slug: string,
  patch: Partial<{ status: ProgressRow["status"]; scrollDepth: number; mastery: number }>
) {
  return fetch("/api/progress", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ slug, ...patch }),
  }).then((r) => r.json());
}
