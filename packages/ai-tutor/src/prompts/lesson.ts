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

export function stripMdx(src: string): string {
  let s = src
  s = s.replace(/^---[\s\S]*?---\n/, '')
  s = s.replace(/^(import|export) .+$/gm, '')
  s = stripTagsAndBlocks(s)
  s = s.replace(/\n{3,}/g, '\n\n').trim()
  return s
}

// Character-level parser instead of regex: defeats CodeQL's incomplete-multi-
// character-sanitization warning (each regex pass would only catch one shape),
// handles `</script >` with whitespace, and is robust against nested/malformed
// tag injection like `<scr<script>ipt>`.
function stripTagsAndBlocks(input: string): string {
  const lower = input.toLowerCase()
  const out: string[] = []
  let i = 0
  while (i < input.length) {
    if (input[i] !== '<') {
      out.push(input[i] as string)
      i += 1
      continue
    }
    if (lower.startsWith('<script', i)) {
      i = skipUntilClose(lower, input, i, '</script')
      continue
    }
    if (lower.startsWith('<style', i)) {
      i = skipUntilClose(lower, input, i, '</style')
      continue
    }
    // Generic tag — advance to the next '>' or '<' (whichever first).
    let j = i + 1
    while (j < input.length && input[j] !== '>' && input[j] !== '<') j += 1
    i = j < input.length && input[j] === '>' ? j + 1 : j
  }
  return out.join('')
}

function skipUntilClose(lower: string, input: string, start: number, closeMarker: string): number {
  const closeIdx = lower.indexOf(closeMarker, start + closeMarker.length)
  if (closeIdx < 0) return input.length
  const gt = input.indexOf('>', closeIdx)
  return gt < 0 ? input.length : gt + 1
}
