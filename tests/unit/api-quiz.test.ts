import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { XP, applyStreak, levelOf, updateMastery } from "@/lib/mastery";
import { nextReview } from "@/lib/sr";

/**
 * In-memory SQLite test of the full quiz-submission pipeline mirroring
 * `src/app/api/quiz/route.ts`, but without the Next.js wrapper. This exercises
 * mastery EMA, SuperMemo-2 review scheduling, XP increment, streak rollover,
 * and unique-key handling on the ReviewItem table.
 */

type DB = Database.Database;

function createDb(): DB {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE User (
      id TEXT PRIMARY KEY,
      xp INTEGER NOT NULL DEFAULT 0,
      streakCount INTEGER NOT NULL DEFAULT 0,
      streakDate TEXT
    );
    CREATE TABLE Progress (
      userId TEXT NOT NULL,
      topicSlug TEXT NOT NULL,
      mastery REAL NOT NULL DEFAULT 0,
      scrollDepth REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'in_progress',
      PRIMARY KEY (userId, topicSlug)
    );
    CREATE TABLE QuizAttempt (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      topicSlug TEXT NOT NULL,
      questionId TEXT NOT NULL,
      selected INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      timeMs INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE ReviewItem (
      userId TEXT NOT NULL,
      topicSlug TEXT NOT NULL,
      questionId TEXT NOT NULL,
      easiness REAL NOT NULL DEFAULT 2.5,
      interval INTEGER NOT NULL DEFAULT 0,
      repetitions INTEGER NOT NULL DEFAULT 0,
      dueAt TEXT NOT NULL,
      lastGrade INTEGER,
      PRIMARY KEY (userId, topicSlug, questionId)
    );
  `);
  return db;
}

type Submission = {
  topicSlug: string;
  questionId: string;
  selected: number;
  correct: boolean;
  timeMs: number;
};

/** Mirror of src/app/api/quiz/route.ts POST handler, using the in-memory DB. */
function submitQuiz(db: DB, userId: string, body: Submission, now: Date) {
  // upsert user
  db.prepare(`INSERT OR IGNORE INTO User (id) VALUES (?)`).run(userId);

  // record attempt
  db.prepare(
    `INSERT INTO QuizAttempt (userId, topicSlug, questionId, selected, correct, timeMs)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userId, body.topicSlug, body.questionId, body.selected, body.correct ? 1 : 0, body.timeMs);

  // mastery EMA
  const prog = db
    .prepare(`SELECT mastery, scrollDepth FROM Progress WHERE userId = ? AND topicSlug = ?`)
    .get(userId, body.topicSlug) as { mastery: number; scrollDepth: number } | undefined;
  const newMastery = updateMastery(prog?.mastery ?? 0, body.correct);
  db.prepare(
    `INSERT INTO Progress (userId, topicSlug, mastery, scrollDepth, status)
     VALUES (?, ?, ?, ?, 'in_progress')
     ON CONFLICT(userId, topicSlug) DO UPDATE SET mastery = excluded.mastery`
  ).run(userId, body.topicSlug, newMastery, prog?.scrollDepth ?? 0);

  // SR scheduling
  const grade = body.correct ? 4 : 1;
  const existing = db
    .prepare(
      `SELECT easiness, interval, repetitions FROM ReviewItem
       WHERE userId = ? AND topicSlug = ? AND questionId = ?`
    )
    .get(userId, body.topicSlug, body.questionId) as
    | { easiness: number; interval: number; repetitions: number }
    | undefined;
  const sr = nextReview(existing ?? null, grade, now);
  db.prepare(
    `INSERT INTO ReviewItem (userId, topicSlug, questionId, easiness, interval, repetitions, dueAt, lastGrade)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(userId, topicSlug, questionId) DO UPDATE SET
       easiness = excluded.easiness,
       interval = excluded.interval,
       repetitions = excluded.repetitions,
       dueAt = excluded.dueAt,
       lastGrade = excluded.lastGrade`
  ).run(
    userId,
    body.topicSlug,
    body.questionId,
    sr.easiness,
    sr.interval,
    sr.repetitions,
    sr.dueAt.toISOString(),
    sr.lastGrade
  );

  // XP + streak
  const xpDelta = body.correct ? XP.quizCorrect : XP.quizWrong;
  const u = db
    .prepare(`SELECT xp, streakCount, streakDate FROM User WHERE id = ?`)
    .get(userId) as { xp: number; streakCount: number; streakDate: string | null };
  const streak = applyStreak(u.streakCount, u.streakDate ? new Date(u.streakDate) : null, now);
  db.prepare(
    `UPDATE User SET xp = xp + ?, streakCount = ?, streakDate = ? WHERE id = ?`
  ).run(xpDelta, streak.streakCount, streak.streakDate.toISOString(), userId);

  const updated = db
    .prepare(`SELECT xp, streakCount FROM User WHERE id = ?`)
    .get(userId) as { xp: number; streakCount: number };

  return {
    xpDelta,
    xp: updated.xp,
    streakCount: updated.streakCount,
    mastery: newMastery,
    nextDueAt: sr.dueAt,
    level: levelOf(updated.xp),
  };
}

describe("quiz API pipeline", () => {
  let db: DB;
  beforeEach(() => {
    db = createDb();
  });

  it("correct answer awards XP, raises mastery, and schedules a 1-day review", () => {
    const result = submitQuiz(
      db,
      "u1",
      { topicSlug: "01-math/01-linear-algebra", questionId: "q1", selected: 0, correct: true, timeMs: 1500 },
      new Date("2026-05-01T10:00:00Z")
    );
    expect(result.xpDelta).toBe(XP.quizCorrect);
    expect(result.xp).toBe(XP.quizCorrect);
    expect(result.mastery).toBeGreaterThan(0);
    // first correct → 1 day later
    expect(result.nextDueAt.toISOString()).toBe("2026-05-02T10:00:00.000Z");
    expect(result.streakCount).toBe(1);
  });

  it("wrong answer still awards attempt XP but resets SR repetitions", () => {
    const r1 = submitQuiz(
      db,
      "u1",
      { topicSlug: "t/x", questionId: "q1", selected: 0, correct: true, timeMs: 1000 },
      new Date("2026-05-01T10:00:00Z")
    );
    const r2 = submitQuiz(
      db,
      "u1",
      { topicSlug: "t/x", questionId: "q1", selected: 1, correct: false, timeMs: 1000 },
      new Date("2026-05-02T10:00:00Z")
    );
    expect(r2.xpDelta).toBe(XP.quizWrong);
    expect(r2.xp).toBe(r1.xp + XP.quizWrong);

    const sr = db
      .prepare(`SELECT repetitions, interval FROM ReviewItem WHERE userId='u1' AND questionId='q1'`)
      .get() as { repetitions: number; interval: number };
    expect(sr.repetitions).toBe(0);
    expect(sr.interval).toBe(1);
  });

  it("streak increments on consecutive UTC days and resets on a gap", () => {
    submitQuiz(
      db,
      "u1",
      { topicSlug: "t/x", questionId: "q1", selected: 0, correct: true, timeMs: 100 },
      new Date("2026-05-01T05:00:00Z")
    );
    const r2 = submitQuiz(
      db,
      "u1",
      { topicSlug: "t/x", questionId: "q2", selected: 0, correct: true, timeMs: 100 },
      new Date("2026-05-02T05:00:00Z")
    );
    expect(r2.streakCount).toBe(2);

    // skip a day
    const r3 = submitQuiz(
      db,
      "u1",
      { topicSlug: "t/x", questionId: "q3", selected: 0, correct: true, timeMs: 100 },
      new Date("2026-05-04T05:00:00Z")
    );
    expect(r3.streakCount).toBe(1);
  });

  it("same-day attempts don't double-increment streak", () => {
    submitQuiz(
      db,
      "u1",
      { topicSlug: "t/x", questionId: "q1", selected: 0, correct: true, timeMs: 100 },
      new Date("2026-05-01T08:00:00Z")
    );
    const r2 = submitQuiz(
      db,
      "u1",
      { topicSlug: "t/x", questionId: "q2", selected: 0, correct: true, timeMs: 100 },
      new Date("2026-05-01T22:00:00Z")
    );
    expect(r2.streakCount).toBe(1);
  });

  it("two correct in a row promote SR to 6-day interval", () => {
    submitQuiz(
      db,
      "u1",
      { topicSlug: "t/x", questionId: "q1", selected: 0, correct: true, timeMs: 100 },
      new Date("2026-05-01T08:00:00Z")
    );
    submitQuiz(
      db,
      "u1",
      { topicSlug: "t/x", questionId: "q1", selected: 0, correct: true, timeMs: 100 },
      new Date("2026-05-02T08:00:00Z")
    );
    const sr = db
      .prepare(`SELECT repetitions, interval FROM ReviewItem WHERE questionId='q1'`)
      .get() as { repetitions: number; interval: number };
    expect(sr.repetitions).toBe(2);
    expect(sr.interval).toBe(6);
  });

  it("mastery EMA grows monotonically across consecutive correct answers", () => {
    let last = 0;
    for (let i = 0; i < 4; i++) {
      const r = submitQuiz(
        db,
        "u1",
        { topicSlug: "t/x", questionId: `q${i}`, selected: 0, correct: true, timeMs: 100 },
        new Date(`2026-05-0${i + 1}T08:00:00Z`)
      );
      expect(r.mastery).toBeGreaterThan(last - 1e-9);
      last = r.mastery;
    }
    expect(last).toBeLessThanOrEqual(1);
  });

  it("each user keeps a separate XP and streak ledger", () => {
    submitQuiz(
      db,
      "alice",
      { topicSlug: "t/x", questionId: "q1", selected: 0, correct: true, timeMs: 100 },
      new Date("2026-05-01T08:00:00Z")
    );
    submitQuiz(
      db,
      "bob",
      { topicSlug: "t/x", questionId: "q1", selected: 0, correct: false, timeMs: 100 },
      new Date("2026-05-01T08:00:00Z")
    );
    const a = db.prepare(`SELECT xp FROM User WHERE id='alice'`).get() as { xp: number };
    const b = db.prepare(`SELECT xp FROM User WHERE id='bob'`).get() as { xp: number };
    expect(a.xp).toBe(XP.quizCorrect);
    expect(b.xp).toBe(XP.quizWrong);
  });
});
