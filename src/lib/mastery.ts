/** XP awarded per outcome. */
export const XP = {
  quizCorrect: 12,
  quizWrong: 3, // attempt is rewarded; correctness is bonus
  topicCompleted: 50, // first time scrolling to bottom
  reviewSuccess: 6,
} as const;

/** Level thresholds (cumulative XP). Level n requires LEVELS[n] xp. */
export const LEVELS = [0, 100, 250, 500, 900, 1500, 2400, 3600, 5200, 7400, 10000];

export function levelOf(xp: number): { level: number; into: number; toNext: number; nextThreshold: number } {
  let level = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i]) level = i;
    else break;
  }
  const cur = LEVELS[level] ?? 0;
  const nextThreshold = LEVELS[level + 1] ?? cur + 5000;
  return {
    level,
    into: xp - cur,
    toNext: nextThreshold - xp,
    nextThreshold,
  };
}

/** Exponential moving average update of mastery in [0, 1]. */
export function updateMastery(prev: number, correct: boolean, weight = 0.4): number {
  const target = correct ? 1 : 0;
  return Math.max(0, Math.min(1, prev * (1 - weight) + target * weight));
}

/** True if today (UTC) differs from the date in `lastDate`. */
export function isNewDay(lastDate: Date | null | undefined, now = new Date()): boolean {
  if (!lastDate) return true;
  const sameUTCDay =
    lastDate.getUTCFullYear() === now.getUTCFullYear() &&
    lastDate.getUTCMonth() === now.getUTCMonth() &&
    lastDate.getUTCDate() === now.getUTCDate();
  return !sameUTCDay;
}

/** True if `lastDate` is exactly one UTC day before `now`. */
export function isConsecutiveDay(lastDate: Date | null | undefined, now = new Date()): boolean {
  if (!lastDate) return false;
  const a = Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), lastDate.getUTCDate());
  const b = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return b - a === 86_400_000;
}

/** Apply streak rules given a quiz event today. Returns updated count + date. */
export function applyStreak(
  streakCount: number,
  streakDate: Date | null,
  now = new Date()
): { streakCount: number; streakDate: Date } {
  if (!isNewDay(streakDate, now)) {
    return { streakCount, streakDate: streakDate ?? now };
  }
  if (isConsecutiveDay(streakDate, now)) {
    return { streakCount: streakCount + 1, streakDate: now };
  }
  // gap of more than one day: reset
  return { streakCount: 1, streakDate: now };
}
