import { describe, it, expect } from "vitest";
import { tokenize } from "@/lib/viz/tokenize";

describe("tokenizer", () => {
  it("returns no tokens for empty string", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("tokenizes a simple sentence into ≤ chars tokens", () => {
    const t = tokenize("Hello world");
    expect(t.length).toBeGreaterThan(0);
    expect(t.length).toBeLessThan(11);
  });

  it("preserves leading-space marker", () => {
    const t = tokenize("hello world");
    // second word should start with '·'
    const display = t.map((x) => x.text).join("|");
    expect(display).toContain("·");
  });

  it("ids are stable across calls for same text", () => {
    const a = tokenize("Attention is all you need.");
    const b = tokenize("Attention is all you need.");
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
  });
});
