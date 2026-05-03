"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { credentials: "same-origin" }).then((r) => r.json());

export type SessionUser = {
  id: string;
  xp: number;
  streakCount: number;
  streakDate: string | null;
  prefs: string;
  createdAt: string;
};

export function useSession() {
  const { data, error, isLoading, mutate } = useSWR<{ user: SessionUser }>("/api/session", fetcher, {
    revalidateOnFocus: false,
  });
  return { user: data?.user, error, isLoading, mutate };
}
