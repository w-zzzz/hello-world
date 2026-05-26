/**
 * XP threshold for reaching level n (n >= 1). Level 1 starts at 0 XP.
 *
 *   xpForLevel(1) = 0
 *   xpForLevel(n) = floor(100 * (n - 1) ^ 1.5)  for n >= 2
 *
 * The curve is intentionally gentle early and steeper later: level 10
 * ≈ 2,711 XP; level 25 ≈ 11,758; level 50 ≈ 34,294; level 100 ≈ 99,496.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.floor(100 * (level - 1) ** 1.5)
}

export interface LevelInfo {
  level: number
  /** XP earned past the start of the current level. */
  xpIntoLevel: number
  /** XP required to advance to the next level. */
  xpForNext: number
}

const MAX_LEVEL = 200

/**
 * Given a user's total XP, return their current level + progress toward next.
 * Uses a tight loop bounded by `MAX_LEVEL` (currently 200, far beyond realistic XP).
 */
export function levelForXp(totalXp: number): LevelInfo {
  if (totalXp <= 0) return { level: 1, xpIntoLevel: 0, xpForNext: xpForLevel(2) - xpForLevel(1) }
  let level = 1
  while (level < MAX_LEVEL && xpForLevel(level + 1) <= totalXp) {
    level += 1
  }
  const floor = xpForLevel(level)
  const ceiling = xpForLevel(level + 1)
  return {
    level,
    xpIntoLevel: totalXp - floor,
    xpForNext: ceiling - floor,
  }
}
