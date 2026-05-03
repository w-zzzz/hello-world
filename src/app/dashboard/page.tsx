"use client";

import { useSession } from "@/hooks/useSession";
import { useAllProgress } from "@/hooks/useProgress";
import { StreakRing } from "@/components/dashboard/StreakRing";
import { XPBar } from "@/components/dashboard/XPBar";
import { DueQueue } from "@/components/dashboard/DueQueue";
import { PartProgress } from "@/components/dashboard/PartProgress";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { EmptyState, type EmptyStateSuggestion } from "@/components/dashboard/EmptyState";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { TOPICS } from "../../../content/curriculum";

// Curated starter set — easy → frontier — pulled from TOPICS by slug so the
// blurbs and links stay accurate even if the curriculum reshuffles.
const STARTER_SLUGS = [
  "01-math/01-linear-algebra",
  "03-deep-learning/04-attention",
  "05-reasoning-agents/01-o1-o3-r1",
] as const;

const STARTER_TINTS: Record<string, string> = {
  "01-math/01-linear-algebra": "--color-part-1",
  "03-deep-learning/04-attention": "--color-part-3",
  "05-reasoning-agents/01-o1-o3-r1": "--color-part-5",
};

function buildStarterSuggestions(): EmptyStateSuggestion[] {
  return STARTER_SLUGS
    .map((slug) => TOPICS.find((t) => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map((t) => ({
      href: `/learn/${t.slug}`,
      eyebrow: `${t.estMinutes} min · difficulty ${t.difficulty}/5`,
      title: t.title,
      body: t.hook,
      tint: STARTER_TINTS[t.slug],
    }));
}

export default function DashboardPage() {
  const { user, isLoading } = useSession();
  const { progress } = useAllProgress();
  const xp = user?.xp ?? 0;
  const streak = user?.streakCount ?? 0;
  const totalTopics = TOPICS.length;
  const completed = progress.filter((p) => p.status === "completed").length;
  const inProgress = progress.filter((p) => p.status === "in_progress").length;
  // Empty-state heuristic: no progress rows recorded *and* no XP yet.
  // We wait for the session/progress fetch so the empty hero doesn't flash
  // for a tick on returning users.
  const isFreshUser = !isLoading && progress.length === 0 && xp === 0;

  return (
    <main className="pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
              Dashboard
            </div>
            <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
              {user ? (isFreshUser ? "Welcome." : "Hello again.") : "Loading…"}
            </h1>
            {!isFreshUser && (
              <p className="mt-4 text-lg text-[var(--color-muted-fg)] max-w-xl text-pretty">
                {completed > 0
                  ? `You've completed ${completed} of ${totalTopics} topics. Keep going.`
                  : `Take a quiz on any topic to start tracking mastery.`}
              </p>
            )}
          </div>
        </ScrollReveal>

        {isFreshUser ? (
          <div className="mt-16">
            <EmptyState
              eyebrow="Day one"
              headline="Start with one topic."
              subhead="Pick something interesting. Take a quiz. The map remembers."
              suggestions={buildStarterSuggestions()}
            />
            <ScrollReveal delay={0.25}>
              <div className="mt-12 rounded-3xl border border-soft surface p-6 sm:p-7 flex items-center justify-between gap-6 flex-wrap">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
                    First day starts now
                  </div>
                  <p className="mt-1.5 text-sm text-[var(--color-muted-fg)] max-w-md text-pretty">
                    Your streak, XP, and review queue light up the moment you finish your first quiz.
                  </p>
                </div>
                <a
                  href="/map"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] px-5 py-2.5 text-sm font-medium hover:scale-[1.02] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                >
                  Browse the full map
                </a>
              </div>
            </ScrollReveal>
          </div>
        ) : (
          <>
            <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_1fr_1fr]">
              <ScrollReveal delay={0.05}><XPBar xp={xp} /></ScrollReveal>
              <ScrollReveal delay={0.1}><StreakRing count={streak} /></ScrollReveal>
              <ScrollReveal delay={0.15}><DueQueue /></ScrollReveal>
            </div>

            <div className="mt-5">
              <ScrollReveal delay={0.18}><ActivityHeatmap /></ScrollReveal>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <ScrollReveal delay={0.2}><PartProgress progress={progress} /></ScrollReveal>
              <ScrollReveal delay={0.25}>
                <div className="rounded-3xl border border-soft surface p-6">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
                    Mastery
                  </div>
                  <ul className="mt-5 space-y-3 text-sm">
                    <Stat label="Topics completed" value={completed} total={totalTopics} />
                    <Stat label="Topics in progress" value={inProgress} total={totalTopics} />
                    <Stat label="Mastery (avg)" value={Math.round(avgMastery(progress) * 100)} total={100} suffix="%" />
                  </ul>
                </div>
              </ScrollReveal>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function avgMastery(progress: { mastery: number }[]) {
  if (!progress.length) return 0;
  return progress.reduce((s, p) => s + p.mastery, 0) / progress.length;
}

function Stat({ label, value, total, suffix }: { label: string; value: number; total: number; suffix?: string }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[var(--color-muted-fg)]">{label}</span>
        <span className="font-medium tabular-nums">
          {value}
          {suffix ?? ""} <span className="text-[var(--color-muted-fg)]">/ {total}{suffix ?? ""}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-[var(--color-muted)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-part-7)] transition-all duration-700"
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </li>
  );
}
