import type { ComponentType } from 'react'
import { CURRICULUM } from './curriculum'
import type { LessonMeta } from './schema'
import type { Locale } from './types'

export interface LoadedLesson {
  meta: LessonMeta
  Mdx: ComponentType
  ready: boolean
}

export async function getLesson(id: string, locale: Locale): Promise<LoadedLesson | null> {
  const record = CURRICULUM.lessons.find((l) => l.meta.id === id)
  if (!record) return null
  const { meta } = record
  if (!record.mdxReady) {
    const Stub = () => null
    return { meta, Mdx: Stub, ready: false }
  }
  const mod = await import(
    /* @vite-ignore */
    `../lessons/${meta.trackId}/${meta.module}/${meta.id}/lesson.${locale}.mdx`
  )
  return { meta, Mdx: mod.default as ComponentType, ready: true }
}
