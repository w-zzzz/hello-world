import { PATHS, type LearningPath, type Difficulty, type PathStep } from "../../content/paths";
import { TOPIC_BY_SLUG, PART_BY_SLUG } from "../../content/curriculum";
import type { TopicMeta, Part } from "@/lib/types";

export type ResolvedStep = PathStep & {
  topic: TopicMeta;
  part: Part;
  /** Index inside the path (0-based). */
  index: number;
};

/** Resolve a path's steps to full topic + part records. */
export function resolveSteps(path: LearningPath): ResolvedStep[] {
  return path.steps.map((step, index) => {
    const topic = TOPIC_BY_SLUG[step.topicSlug];
    if (!topic) {
      throw new Error(`Path "${path.slug}" references missing topic "${step.topicSlug}".`);
    }
    const part = PART_BY_SLUG[topic.partSlug];
    return { ...step, topic, part, index };
  });
}

/** Total estimated reading time in minutes (sum of step.estMinutes overrides or topic.estMinutes). */
export function totalMinutes(path: LearningPath): number {
  return path.steps.reduce((acc, s) => {
    const t = TOPIC_BY_SLUG[s.topicSlug];
    return acc + (s.estMinutes ?? t?.estMinutes ?? 0);
  }, 0);
}

/** Pretty-print a duration in hours + minutes. */
export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const DIFF_RANK: Record<Difficulty, number> = {
  introductory: 0,
  intermediate: 1,
  advanced: 2,
  frontier: 3,
};

export function difficultyRank(d: Difficulty): number {
  return DIFF_RANK[d];
}

export function sortByDifficulty(paths: LearningPath[]): LearningPath[] {
  return [...paths].sort((a, b) => DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty]);
}

/** Edges (prereq → step) restricted to topics that appear in the path. */
export function pathEdges(path: LearningPath): Array<[string, string]> {
  const inPath = new Set(path.steps.map((s) => s.topicSlug));
  const out: Array<[string, string]> = [];
  for (const slug of inPath) {
    const t = TOPIC_BY_SLUG[slug];
    if (!t) continue;
    for (const p of t.prereqs) {
      if (inPath.has(p)) out.push([p, slug]);
    }
  }
  return out;
}

/**
 * "If you finished X, try Y." Returns up to `n` other paths,
 * preferring ones that share a part with the current path's steps.
 */
export function relatedPaths(current: LearningPath, n = 3): LearningPath[] {
  const currentParts = new Set(
    current.steps.map((s) => TOPIC_BY_SLUG[s.topicSlug]?.partSlug).filter(Boolean)
  );
  const others = PATHS.filter((p) => p.slug !== current.slug);
  const scored = others.map((p) => {
    const overlap = p.steps.reduce((acc, s) => {
      const ps = TOPIC_BY_SLUG[s.topicSlug]?.partSlug;
      return ps && currentParts.has(ps) ? acc + 1 : acc;
    }, 0);
    return { p, overlap };
  });
  scored.sort((a, b) => b.overlap - a.overlap);
  return scored.slice(0, n).map((s) => s.p);
}

export type { LearningPath, Difficulty, PathStep };
export { PATHS };
