import 'server-only'
import { aiUsage, db } from '@quant-academy/db'
import { and, eq, sql } from 'drizzle-orm'
import { MAX_SONNET_INPUT_PER_DAY, MAX_SONNET_OUTPUT_PER_DAY } from './types'

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function checkSonnetBudget(
  userId: string,
  estimatedInput: number,
): Promise<
  | { ok: true }
  | {
      ok: false
      reason: 'sonnet_input' | 'sonnet_output'
      usedToday: number
      cap: number
    }
> {
  const day = todayUtc()
  const rows = await db
    .select()
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, day)))
    .limit(1)
  const used = rows[0] ?? { sonnetIn: 0, sonnetOut: 0 }
  if (used.sonnetIn + estimatedInput > MAX_SONNET_INPUT_PER_DAY) {
    return {
      ok: false,
      reason: 'sonnet_input',
      usedToday: used.sonnetIn,
      cap: MAX_SONNET_INPUT_PER_DAY,
    }
  }
  if (used.sonnetOut >= MAX_SONNET_OUTPUT_PER_DAY) {
    return {
      ok: false,
      reason: 'sonnet_output',
      usedToday: used.sonnetOut,
      cap: MAX_SONNET_OUTPUT_PER_DAY,
    }
  }
  return { ok: true }
}

export async function recordSonnetUsage(
  userId: string,
  input: number,
  output: number,
): Promise<void> {
  const day = todayUtc()
  await db
    .insert(aiUsage)
    .values({ userId, day, sonnetIn: input, sonnetOut: output })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.day],
      set: {
        sonnetIn: sql`${aiUsage.sonnetIn} + ${input}`,
        sonnetOut: sql`${aiUsage.sonnetOut} + ${output}`,
      },
    })
}

const CJK_BASE = 0x2e80 // CJK Radicals Supplement and above (covers han, hiragana, katakana, hangul)
const CJK_TOP = 0x9fff // Up through CJK Unified Ideographs — close enough for budgeting
const HANGUL_TOP = 0xd7af // Plus Hangul Jamo / Syllables

export function estimateInputTokens(text: string): number {
  // Cheap, code-point-aware approximation:
  //   - Non-CJK: 1 token per ~3.5 chars (English-heavy)
  //   - CJK (Han, kana, hangul, halfwidth-fullwidth):
  //       conservatively 1.5 tokens per char (closer to Anthropic's
  //       observed ratio than the 0.286 the old formula implied)
  let nonCjkChars = 0
  let cjkChars = 0
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0
    if (
      (cp >= CJK_BASE && cp <= CJK_TOP) ||
      (cp >= 0xac00 && cp <= HANGUL_TOP) ||
      (cp >= 0xff00 && cp <= 0xffef) ||
      (cp >= 0x3000 && cp <= 0x303f)
    ) {
      cjkChars += 1
    } else {
      nonCjkChars += 1
    }
  }
  return Math.ceil(nonCjkChars / 3.5 + cjkChars * 1.5)
}
