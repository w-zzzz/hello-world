import { describe, it, expect } from "vitest";
import { applyStreak, isConsecutiveDay, isNewDay, levelOf, updateMastery, XP } from "@/lib/mastery";

describe("levelOf", () => {
  it("level 0 at xp=0", () => expect(levelOf(0).level).toBe(0));
  it("level 1 at threshold 100", () => expect(levelOf(100).level).toBe(1));
  it("level 1 just below 250", () => expect(levelOf(249).level).toBe(1));
  it("level 5 at 1500", () => expect(levelOf(1500).level).toBe(5));
  it("toNext is correct at xp=250", () => {
    const l = levelOf(250);
    expect(l.toNext).toBe(250); // 500 - 250
  });
});

describe("updateMastery EMA", () => {
  it("starts at 0 with weight default 0.4 → correct moves to 0.4", () => {
    expect(updateMastery(0, true)).toBeCloseTo(0.4);
  });
  it("wrong answer pulls toward 0", () => {
    expect(updateMastery(0.5, false)).toBeCloseTo(0.3);
  });
  it("clamps to [0,1]", () => {
    expect(updateMastery(1.2, true)).toBeLessThanOrEqual(1);
    expect(updateMastery(-0.2, false)).toBeGreaterThanOrEqual(0);
  });
});

describe("streak rules", () => {
  it("isNewDay is true when no last date", () => {
    expect(isNewDay(null)).toBe(true);
  });
  it("isNewDay false same UTC day", () => {
    const a = new Date("2026-05-01T05:00:00Z");
    const b = new Date("2026-05-01T22:00:00Z");
    expect(isNewDay(a, b)).toBe(false);
  });
  it("isNewDay true across UTC midnight", () => {
    const a = new Date("2026-05-01T23:30:00Z");
    const b = new Date("2026-05-02T00:30:00Z");
    expect(isNewDay(a, b)).toBe(true);
  });
  it("isConsecutiveDay correct", () => {
    expect(isConsecutiveDay(new Date("2026-05-01T10:00Z"), new Date("2026-05-02T10:00Z"))).toBe(true);
    expect(isConsecutiveDay(new Date("2026-05-01T10:00Z"), new Date("2026-05-03T10:00Z"))).toBe(false);
  });
  it("first ever quiz seeds streak=1", () => {
    const r = applyStreak(0, null, new Date("2026-05-01"));
    expect(r.streakCount).toBe(1);
  });
  it("same day does not double-increment", () => {
    const date = new Date("2026-05-01T08:00Z");
    const r = applyStreak(5, date, new Date("2026-05-01T20:00Z"));
    expect(r.streakCount).toBe(5);
  });
  it("consecutive day increments streak", () => {
    const r = applyStreak(5, new Date("2026-05-01T10:00Z"), new Date("2026-05-02T11:00Z"));
    expect(r.streakCount).toBe(6);
  });
  it("gap of 2 days resets streak", () => {
    const r = applyStreak(5, new Date("2026-05-01T10:00Z"), new Date("2026-05-03T11:00Z"));
    expect(r.streakCount).toBe(1);
  });
});

describe("XP table", () => {
  it("correct quiz worth more than wrong attempt", () => {
    expect(XP.quizCorrect).toBeGreaterThan(XP.quizWrong);
  });
});
