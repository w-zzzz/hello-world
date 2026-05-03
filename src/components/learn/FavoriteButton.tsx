"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  className?: string;
  /** Compact icon-only style for inline use. */
  compact?: boolean;
};

export function FavoriteButton({ slug, className, compact = false }: Props) {
  const { isFavorite, toggle } = useFavorites();
  const reduce = useReducedMotion();
  const fav = isFavorite(slug);
  const [pulsing, setPulsing] = React.useState(false);

  const onClick = async () => {
    setPulsing(true);
    await toggle(slug);
    if (reduce) setPulsing(false);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={fav}
      aria-label={fav ? "Saved — remove from favorites" : "Save — add to favorites"}
      title={fav ? "Saved" : "Save for later"}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full border border-soft text-xs font-medium transition-colors",
        compact ? "h-8 w-8 justify-center" : "h-8 px-3",
        fav
          ? "text-[var(--color-accent)] border-[var(--color-accent)]/40 bg-[var(--color-accent)]/8"
          : "text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] hover:bg-[var(--color-muted)]",
        className
      )}
    >
      <motion.span
        initial={false}
        animate={pulsing && !reduce ? { scale: [1, 1.35, 1], rotate: [0, -8, 0] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        onAnimationComplete={() => setPulsing(false)}
        className="grid place-items-center"
      >
        <Star
          className={cn("h-3.5 w-3.5", fav && "fill-current")}
          strokeWidth={2}
        />
      </motion.span>
      {!compact && <span>{fav ? "Saved" : "Save"}</span>}
    </button>
  );
}
