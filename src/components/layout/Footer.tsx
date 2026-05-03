"use client";

import Link from "next/link";
import { Brain, Flame, Sparkles } from "lucide-react";
import { useSession } from "@/hooks/useSession";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-soft">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-12 md:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-part-7)] text-white">
              <Brain className="h-4 w-4" />
            </span>
            <span>MLMap</span>
          </Link>
          <p className="mt-4 text-sm text-[var(--color-muted-fg)] max-w-xs leading-relaxed">
            A PhD-grade interactive learning map for modern machine learning, deep learning, and AI.
          </p>
        </div>
        <FooterCol
          title="Learn"
          links={[
            { href: "/map", label: "Curriculum map" },
            { href: "/paths", label: "Guided paths" },
            { href: "/learn/01-math/01-linear-algebra", label: "Start from foundations" },
            { href: "/learn/03-deep-learning/04-attention", label: "Attention" },
            { href: "/learn/06-multimodal/03-diffusion-ddpm-sd", label: "Diffusion models" },
          ]}
        />
        <FooterCol
          title="Discover"
          links={[
            { href: "/timeline", label: "Field timeline" },
            { href: "/stories", label: "Stories & essays" },
            { href: "/researchers", label: "Pioneers & leaders" },
            { href: "/resources", label: "Reading lists" },
            { href: "/playground/gradient-descent", label: "Playgrounds" },
            { href: "/dashboard", label: "Your progress" },
          ]}
        />
        <FooterCol
          title="About"
          links={[
            { href: "https://huggingface.co", label: "Hugging Face", external: true },
            { href: "https://distill.pub", label: "Distill.pub", external: true },
            { href: "https://transformer-circuits.pub", label: "Transformer Circuits", external: true },
            { href: "https://lilianweng.github.io", label: "Lil'Log", external: true },
          ]}
        />
      </div>
      <div className="border-t border-soft">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--color-muted-fg)]">
          <span>© {new Date().getFullYear()} MLMap. Built for the curious.</span>
          <div className="flex items-center gap-3">
            <StreakBadge />
            <span className="hidden sm:inline">From first principles to the frontier.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function StreakBadge() {
  const { user } = useSession();
  if (!user) return null;
  const streak = user.streakCount ?? 0;
  const xp = user.xp ?? 0;
  if (streak === 0 && xp === 0) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-full border border-soft px-2.5 py-1 text-[11px] hover:text-[var(--color-fg)] transition-colors"
        title="Open dashboard"
      >
        <Sparkles className="h-3 w-3 text-[var(--color-accent)]" />
        Start your streak
      </Link>
    );
  }
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 rounded-full border border-soft px-2.5 py-1 text-[11px] hover:text-[var(--color-fg)] transition-colors"
      title="Open dashboard"
    >
      {streak > 0 && (
        <span className="inline-flex items-center gap-1">
          <Flame className="h-3 w-3 text-[var(--color-part-1)]" />
          <span className="tabular-nums font-medium text-[var(--color-fg)]">
            {streak}
          </span>
          <span>day{streak === 1 ? "" : "s"}</span>
        </span>
      )}
      {streak > 0 && xp > 0 && <span className="opacity-40">·</span>}
      {xp > 0 && (
        <span className="inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-[var(--color-accent)]" />
          <span className="tabular-nums font-medium text-[var(--color-fg)]">
            {xp}
          </span>
          <span>XP</span>
        </span>
      )}
    </Link>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
        {title}
      </div>
      <ul className="mt-5 space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm hover:text-[var(--color-accent)] transition-colors"
              {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
