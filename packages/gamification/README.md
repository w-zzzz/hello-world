# @quant-academy/gamification

Pure-functional XP, level, and streak logic for Quant Academy. **This package is the single source of truth.** Consumer code (web app, mobile, backend) MUST import these helpers and MUST NOT redefine the formulas.

## XP formula

`total = round(base * difficulty * quizMultiplier * firstTry) + streakBonus`

| Component          | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| `base`             | lesson XP from content meta                                            |
| `difficulty`       | beginner 1.0, intermediate 1.5, advanced 2.0                           |
| `quizMultiplier`   | 0.5 + 0.5 * (correct / total), clamped to [0.5, 1.0]; 1.0 if no quiz   |
| `firstTry`         | 1.25 when `attempts <= 1`, else 1.0                                    |
| `streakBonus`      | `min(currentStreak, 30) * 5` XP, added (not multiplied)                |

## Level curve

`xpForLevel(1) = 0`; for `n >= 2`, `xpForLevel(n) = floor(100 * (n - 1) ^ 1.5)`.

| Level | XP threshold |
| ----- | ------------ |
| 2     | 100          |
| 10    | 2,700        |
| 25    | 11,758       |
| 50    | 34,294       |
| 100   | 99,496       |

## Streak transitions

- same-day event: state unchanged
- next-day event: `current += 1`, `longest = max(longest, current)`
- gap of two or more days: `current = 1`
- out-of-order (past-dated) event: ignored

All date inputs are ISO `YYYY-MM-DD` strings interpreted in UTC. No `Date` mutation happens inside this package.
