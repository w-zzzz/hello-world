import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getLessonRecord } from '@quant-academy/content'

const LESSONS_ROOT = resolve(
  fileURLToPath(import.meta.url),
  '..',
  '..',
  '..',
  '..',
  'content',
  'lessons',
)

const cache = new Map<string, string>()

/**
 * Returns a flattened prose extract of the lesson MDX (current locale),
 * with JSX tags stripped. Caches in-process.
 */
export async function getLessonContext(
  lessonId: string,
  locale: 'zh' | 'en',
): Promise<string | null> {
  const key = `${lessonId}:${locale}`
  if (cache.has(key)) return cache.get(key) ?? null
  const record = getLessonRecord(lessonId)
  if (!record?.mdxReady) return null
  const path = resolve(
    LESSONS_ROOT,
    record.meta.trackId,
    record.meta.module,
    record.meta.id,
    `lesson.${locale}.mdx`,
  )
  let raw: string
  try {
    raw = await readFile(path, 'utf-8')
  } catch {
    return null
  }
  const stripped = stripMdx(raw)
  const out = `# Current lesson: ${record.meta.id}\n\n${stripped}`
  cache.set(key, out)
  return out
}

function stripMdx(src: string): string {
  // Remove all JSX elements (<Tag ...>...</Tag> and self-closing <Tag />).
  // This is approximate; enough for context extraction.
  let s = src
  // Strip front-matter if any
  s = s.replace(/^---[\s\S]*?---\n/, '')
  // Remove import / export lines
  s = s.replace(/^(import|export) .+$/gm, '')
  // Remove JSX-style component tags, keeping inner content for components that are mostly text
  s = s.replace(/<\/?\w+[^>]*\/?>/g, '')
  // Collapse blank lines
  s = s.replace(/\n{3,}/g, '\n\n').trim()
  return s
}
