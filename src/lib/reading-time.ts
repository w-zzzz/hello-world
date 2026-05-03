/** Average adult reading speed: ~225 wpm. We use 220 to be slightly conservative
 *  for technical material, and clamp to a sensible floor. */
export function estimateReadingMinutes(content: string): number {
  // Strip code fences, math, html-ish tags, and frontmatter-style noise so the
  // word count better reflects body prose.
  const cleaned = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$\n]+\$/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`~|]/g, " ");
  const words = cleaned.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
