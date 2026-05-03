import { describe, it, expect } from "vitest";
import { nextReview } from "@/lib/sr";

describe("SuperMemo-2", () => {
  it("starts fresh on first correct (q=4)", () => {
    const r = nextReview(null, 4, new Date("2026-01-01T00:00:00Z"));
    expect(r.repetitions).toBe(1);
    expect(r.interval).toBe(1);
    expect(r.easiness).toBeCloseTo(2.5, 5);
    expect(r.dueAt.toISOString()).toBe("2026-01-02T00:00:00.000Z");
  });

  it("second correct interval is 6 days", () => {
    const r1 = nextReview(null, 5, new Date("2026-01-01"));
    const r2 = nextReview(r1, 5, new Date("2026-01-02"));
    expect(r2.repetitions).toBe(2);
    expect(r2.interval).toBe(6);
  });

  it("third correct uses easiness multiplier", () => {
    let s = nextReview(null, 5, new Date("2026-01-01"));
    const e2 = nextReview(s, 5, new Date("2026-01-02"));
    s = e2;
    const e3 = nextReview(s, 5, new Date("2026-01-08"));
    expect(e3.repetitions).toBe(3);
    // SM-2 multiplies the *previous* easiness by the previous interval
    expect(e3.interval).toBe(Math.round(6 * e2.easiness));
  });

  it("failure (q < 3) restarts repetitions and interval to 1 day", () => {
    let s = nextReview(null, 5, new Date("2026-01-01"));
    s = nextReview(s, 5, new Date("2026-01-02"));
    s = nextReview(s, 1, new Date("2026-01-08"));
    expect(s.repetitions).toBe(0);
    expect(s.interval).toBe(1);
  });

  it("easiness is floored at 1.3", () => {
    let s = nextReview(null, 0);
    for (let i = 0; i < 10; i++) s = nextReview(s, 0);
    expect(s.easiness).toBeGreaterThanOrEqual(1.3);
  });

  it("perfect grade (5) increases easiness", () => {
    const s = nextReview(null, 5);
    expect(s.easiness).toBeGreaterThan(2.5);
  });

  it("hesitant correct (3) does not change easiness much", () => {
    const s = nextReview(null, 3);
    expect(s.easiness).toBeCloseTo(2.36, 1);
  });
});
