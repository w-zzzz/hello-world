import "server-only";
import type { Heading } from "@/components/learn/TableOfContents";

/** Slugify the way rehype-slug does (github-slugger): lowercased, non-word
 *  chars stripped, spaces → "-". Good-enough match for our content. */
function slug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Pull h2/h3 headings out of raw MDX source. We deliberately ignore code
 *  fences so a `# foo` inside python doesn't masquerade as a heading. */
export function extractHeadings(mdxSource: string): Heading[] {
  const out: Heading[] = [];
  const lines = mdxSource.split(/\r?\n/);
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const level = m[1].length === 2 ? 2 : 3;
    const text = m[2].replace(/[*_`]/g, "").trim();
    if (!text) continue;
    out.push({ id: slug(text), text, level: level as 2 | 3 });
  }
  return out;
}
