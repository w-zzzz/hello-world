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

export function estimateInputTokens(text: string): number {
  return Math.ceil(text.length / 3.5)
}
