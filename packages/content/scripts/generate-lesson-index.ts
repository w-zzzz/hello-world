import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { globSync } from 'glob'

const root = resolve(import.meta.dirname, '..')
const files = globSync('lessons/**/meta.ts', { cwd: root })
const entries = files
  .map((p) => {
    const id = dirname(p).split('/').pop()
    // Generated file lives at src/lessons.generated.ts; lesson meta files are
    // under lessons/**, so the relative import path is one level up from src/.
    const rel = `../${p.replace(/\\/g, '/').replace(/\.ts$/, '')}`
    return `  '${id}': () => import('${rel}'),`
  })
  .join('\n')
writeFileSync(
  resolve(root, 'src/lessons.generated.ts'),
  `// AUTO-GENERATED — do not edit\nexport const LESSON_META_LOADERS: Record<string, () => Promise<unknown>> = {\n${entries}\n}\n`,
)
console.log(`Generated index with ${files.length} lessons.`)
