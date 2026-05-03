"use client";

import * as React from "react";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url, { credentials: "same-origin" }).then((r) => r.json());

export type FavoriteRow = {
  topicSlug: string;
  createdAt: string;
};

export function useFavorites() {
  const { data, mutate, isLoading } = useSWR<{ favorites: FavoriteRow[] }>(
    "/api/favorites",
    fetcher,
    { revalidateOnFocus: false }
  );

  const favorites = React.useMemo<FavoriteRow[]>(
    () => data?.favorites ?? [],
    [data]
  );
  const slugs = React.useMemo(
    () => new Set(favorites.map((f) => f.topicSlug)),
    [favorites]
  );

  const isFavorite = React.useCallback(
    (slug: string) => slugs.has(slug),
    [slugs]
  );

  /** Toggle favorite state on the server. Optimistically updates the cache. */
  const toggle = React.useCallback(
    async (slug: string) => {
      const currentlyFav = slugs.has(slug);
      const optimistic: FavoriteRow[] = currentlyFav
        ? favorites.filter((f) => f.topicSlug !== slug)
        : [{ topicSlug: slug, createdAt: new Date().toISOString() }, ...favorites];
      mutate({ favorites: optimistic }, { revalidate: false });
      try {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ slug }),
        });
        const json = (await res.json()) as { favorited: boolean };
        await mutate();
        return json.favorited;
      } catch {
        await mutate();
        return currentlyFav;
      }
    },
    [favorites, slugs, mutate]
  );

  return { favorites, slugs, isFavorite, toggle, isLoading, mutate };
}
