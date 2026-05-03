import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { FrontmatterSchema } from "@/lib/mdx";

const ContentRoot = path.resolve(process.cwd(), "content/topics");

function listMdxFiles(): string[] {
  const out: string[] = [];
  for (const part of fs.readdirSync(ContentRoot, { withFileTypes: true })) {
    if (!part.isDirectory()) continue;
    const dir = path.join(ContentRoot, part.name);
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith(".mdx")) out.push(path.join(dir, f));
    }
  }
  return out;
}

describe("MDX frontmatter integrity", () => {
  const files = listMdxFiles();

  it("finds at least 40 topic files", () => {
    expect(files.length).toBeGreaterThanOrEqual(40);
  });

  for (const file of files) {
    const rel = path.relative(ContentRoot, file);
    it(`${rel} has valid frontmatter`, () => {
      const raw = fs.readFileSync(file, "utf-8");
      const { data } = matter(raw);
      const result = FrontmatterSchema.safeParse(data);
      if (!result.success) {
        // Surface the field-level errors in a readable form.
        const issues = result.error.issues
          .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
          .join("\n");
        throw new Error(`Invalid frontmatter in ${rel}:\n${issues}`);
      }
    });

    it(`${rel} slug matches its directory path`, () => {
      const raw = fs.readFileSync(file, "utf-8");
      const { data } = matter(raw);
      const expected = rel.replace(/\.mdx$/, "").replace(/\\/g, "/");
      expect(data.slug).toBe(expected);
    });
  }

  it("every quiz question has a unique id within its topic", () => {
    for (const file of files) {
      const raw = fs.readFileSync(file, "utf-8");
      const { data } = matter(raw);
      const ids = (data.quiz ?? []).map((q: { id: string }) => q.id);
      expect(new Set(ids).size, `dup quiz id in ${file}`).toBe(ids.length);
    }
  });

  it("every quiz answer index is within choices range", () => {
    for (const file of files) {
      const raw = fs.readFileSync(file, "utf-8");
      const { data } = matter(raw);
      for (const q of data.quiz ?? []) {
        expect(q.answer, `${file} ${q.id}`).toBeGreaterThanOrEqual(0);
        expect(q.answer, `${file} ${q.id}`).toBeLessThan(q.choices.length);
      }
    }
  });
});
