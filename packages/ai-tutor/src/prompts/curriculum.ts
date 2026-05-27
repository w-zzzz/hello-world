import { CURRICULUM, TRACKS } from '@quant-academy/content'

let cached: string | null = null

export function getCurriculumIndex(): string {
  if (cached) return cached
  const lines: string[] = []
  lines.push('# Quant Academy Curriculum (110 lessons across 8 tracks)\n')
  for (const t of TRACKS) {
    lines.push(
      `\n## Track ${t.id} — ${t.titleKey.replace('tracks.', '').replace('.title', '').toUpperCase()}`,
    )
  }
  // Then a flat list of lessons by id with module + difficulty
  lines.push('\n## All lessons\n')
  for (const record of CURRICULUM.lessons) {
    const m = record.meta
    lines.push(
      `- \`${m.id}\` (Track ${m.trackId}, ${m.module}, ${m.difficulty}, ${m.durationMin}min, ${m.xp}XP)`,
    )
  }
  cached = lines.join('\n')
  return cached
}
