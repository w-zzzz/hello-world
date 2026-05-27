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
  let s = src
  s = s.replace(/^---[\s\S]*?---\n/, '')
  s = s.replace(/^(import|export) .+$/gm, '')
  // Iteratively strip script/style blocks and remaining JSX/HTML tags until
  // stable; a single pass leaves crafted inputs like `<scr<script>ipt>` half-
  // sanitized (the inner match becomes a valid outer tag).
  let prev: string
  do {
    prev = s
    s = s.replace(/<script[\s\S]*?<\/script>/gi, '')
    s = s.replace(/<style[\s\S]*?<\/style>/gi, '')
    s = s.replace(/<\/?[a-zA-Z][^>]*>/g, '')
  } while (s !== prev)
  s = s.replace(/\n{3,}/g, '\n\n').trim()
  return s
}
