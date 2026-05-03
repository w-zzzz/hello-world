import { describe, it, expect } from "vitest";
import { TOPICS, PARTS, prereqEdges, TOPIC_BY_SLUG, topicsInPart } from "../../content/curriculum";
import { RESEARCHERS, RESEARCHER_BY_SLUG } from "../../content/researchers";

describe("curriculum integrity", () => {
  it("has all 11 parts", () => {
    expect(PARTS.length).toBe(11);
  });

  it("every topic's part exists", () => {
    const partSlugs = new Set(PARTS.map((p) => p.slug));
    for (const t of TOPICS) {
      expect(partSlugs.has(t.partSlug)).toBe(true);
    }
  });

  it("every prereq references an existing topic", () => {
    for (const t of TOPICS) {
      for (const p of t.prereqs) {
        expect(TOPIC_BY_SLUG[p]).toBeDefined();
      }
    }
  });

  it("prereq DAG has no cycles", () => {
    const edges = prereqEdges();
    const adj = new Map<string, string[]>();
    for (const [a, b] of edges) {
      if (!adj.has(a)) adj.set(a, []);
      adj.get(a)!.push(b);
    }
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map<string, number>();
    for (const t of TOPICS) color.set(t.slug, WHITE);

    function dfs(u: string): boolean {
      color.set(u, GRAY);
      for (const v of adj.get(u) ?? []) {
        if (color.get(v) === GRAY) return true;
        if (color.get(v) === WHITE && dfs(v)) return true;
      }
      color.set(u, BLACK);
      return false;
    }
    for (const t of TOPICS) {
      if (color.get(t.slug) === WHITE && dfs(t.slug)) {
        throw new Error("cycle detected");
      }
    }
  });

  it("each part has at least 3 topics", () => {
    for (const p of PARTS) {
      expect(topicsInPart(p.slug).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("topicIndex starts at 1 within each part", () => {
    for (const p of PARTS) {
      const ts = topicsInPart(p.slug);
      const min = Math.min(...ts.map((t) => t.topicIndex));
      expect(min).toBe(1);
    }
  });

  it("every researcher ref in topics is a known slug", () => {
    for (const t of TOPICS) {
      for (const r of t.researchers) {
        expect(RESEARCHER_BY_SLUG[r]).toBeDefined();
      }
    }
  });

  it("every researcher has a name and short", () => {
    for (const r of RESEARCHERS) {
      expect(r.name.length).toBeGreaterThan(0);
      expect(r.short.length).toBeGreaterThan(10);
    }
  });

  it("hero viz topics have a vizKey", () => {
    for (const t of TOPICS) {
      if (t.hasHeroViz) expect(t.vizKey).toBeDefined();
    }
  });
});
