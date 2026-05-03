import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/paths";

const STYLES: Record<Difficulty, { label: string; ring: string; dot: string }> = {
  introductory: {
    label: "Introductory",
    ring: "ring-[color-mix(in_oklch,var(--color-part-3),transparent_70%)]",
    dot: "bg-[var(--color-part-3)]",
  },
  intermediate: {
    label: "Intermediate",
    ring: "ring-[color-mix(in_oklch,var(--color-part-6),transparent_70%)]",
    dot: "bg-[var(--color-part-6)]",
  },
  advanced: {
    label: "Advanced",
    ring: "ring-[color-mix(in_oklch,var(--color-part-7),transparent_70%)]",
    dot: "bg-[var(--color-part-7)]",
  },
  frontier: {
    label: "Frontier",
    ring: "ring-[color-mix(in_oklch,var(--color-part-10),transparent_70%)]",
    dot: "bg-[var(--color-part-10)]",
  },
};

export function DifficultyPill({
  difficulty,
  className,
  hue,
}: {
  difficulty: Difficulty;
  className?: string;
  hue?: string;
}) {
  const s = STYLES[difficulty];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide",
        "ring-1 surface text-[var(--color-fg)]",
        s.ring,
        className
      )}
    >
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 rounded-full", !hue && s.dot)}
        style={hue ? { backgroundColor: hue } : undefined}
      />
      {s.label}
    </span>
  );
}
