import { z } from 'zod'

export const TrackIdSchema = z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
export type TrackId = z.infer<typeof TrackIdSchema>

export const DifficultySchema = z.enum(['beginner', 'intermediate', 'advanced'])
export type Difficulty = z.infer<typeof DifficultySchema>

export const LessonMetaSchema = z.object({
  id: z.string().regex(/^[A-H]-\d{2}-[a-z0-9-]+$/),
  trackId: TrackIdSchema,
  module: z.string(),
  order: z.number().int().positive(),
  difficulty: DifficultySchema,
  durationMin: z.number().int().positive(),
  xp: z.number().int().positive(),
  prerequisites: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  contributors: z.array(z.string()).default([]),
})
export type LessonMeta = z.infer<typeof LessonMetaSchema>

export const TrackMetaSchema = z.object({
  id: TrackIdSchema,
  titleKey: z.string(),
  descriptionKey: z.string(),
  color: z.string(),
  order: z.number().int(),
})
export type TrackMeta = z.infer<typeof TrackMetaSchema>

export function defineLesson(meta: LessonMeta): LessonMeta {
  return LessonMetaSchema.parse(meta)
}
