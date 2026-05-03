import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import type { TopicFrontmatter } from "@/lib/types";

const ContentRoot = path.resolve(process.cwd(), "content/topics");

const PaperSchema = z.object({
  title: z.string(),
  authors: z.string(),
  year: z.number(),
  url: z.string().url(),
  venue: z.string().optional(),
});

const ResourceSchema = z.object({
  kind: z.enum(["course", "blog", "paper", "video", "book", "model", "dataset", "library", "doc"]),
  title: z.string(),
  source: z.string().optional(),
  url: z.string().url(),
  notes: z.string().optional(),
});

const QuizSchema = z.object({
  id: z.string(),
  question: z.string(),
  choices: z.array(z.string()).min(2).max(6),
  answer: z.number().int().min(0),
  explanation: z.string(),
});

export const FrontmatterSchema = z.object({
  slug: z.string(),
  part: z.string(),
  partTitle: z.string(),
  partIndex: z.number().int(),
  topicIndex: z.number().int(),
  title: z.string(),
  hook: z.string(),
  estMinutes: z.number().int().positive(),
  difficulty: z.number().int().min(1).max(5),
  prereqs: z.array(z.string()).default([]),
  hasHeroViz: z.boolean().default(false),
  vizKey: z.string().optional(),
  researchers: z.array(z.string()).default([]),
  papers: z.array(PaperSchema).default([]),
  hfResources: z.array(ResourceSchema).default([]),
  freeResources: z.array(ResourceSchema).default([]),
  quiz: z.array(QuizSchema).default([]),
});

export type LoadedTopic = {
  frontmatter: TopicFrontmatter;
  content: string;
};

export async function loadTopicSource(slug: string): Promise<LoadedTopic | null> {
  const file = path.join(ContentRoot, `${slug}.mdx`);
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf-8");
  } catch {
    return null;
  }
  const { data, content } = matter(raw);
  const parsed = FrontmatterSchema.parse(data);
  return { frontmatter: parsed as TopicFrontmatter, content };
}

export async function listTopicSlugs(): Promise<string[]> {
  const out: string[] = [];
  const parts = await fs.readdir(ContentRoot, { withFileTypes: true });
  for (const part of parts) {
    if (!part.isDirectory()) continue;
    const files = await fs.readdir(path.join(ContentRoot, part.name));
    for (const f of files) {
      if (!f.endsWith(".mdx")) continue;
      out.push(`${part.name}/${f.replace(/\.mdx$/, "")}`);
    }
  }
  return out;
}
