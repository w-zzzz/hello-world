/** SuperMemo-2 spaced repetition.
 *
 *  Grade scale (q):
 *    0 — total blackout
 *    1 — incorrect, but recognized once shown
 *    2 — incorrect, but felt close
 *    3 — correct, with serious difficulty
 *    4 — correct, with hesitation
 *    5 — perfect recall
 *
 *  In our quiz UI we map quiz wrong → q=1 (item enters/stays in queue),
 *  quiz correct → q=4, review correct → q=5.
 */

export type SRState = {
  easiness: number;
  interval: number; // days
  repetitions: number;
};

export type SRReview = SRState & {
  dueAt: Date;
  lastGrade: number;
};

const ONE_DAY_MS = 86_400_000;

export function nextReview(prev: SRState | null, q: number, now = new Date()): SRReview {
  const easinessIn = prev?.easiness ?? 2.5;
  const intervalIn = prev?.interval ?? 0;
  const repetitionsIn = prev?.repetitions ?? 0;

  let repetitions = repetitionsIn;
  let interval = intervalIn;

  if (q < 3) {
    // failure: restart
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(intervalIn * easinessIn);
  }

  // SM-2 easiness update; floor at 1.3
  const ef = easinessIn + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  const easiness = Math.max(1.3, ef);

  const dueAt = new Date(now.getTime() + interval * ONE_DAY_MS);
  return { easiness, interval, repetitions, dueAt, lastGrade: q };
}
