import 'server-only'
import { randomUUID } from 'node:crypto'
import { db, users } from '@quant-academy/db'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { getAuthMode } from './config'
import type { AuthUser } from './types'

export type { AuthUser } from './types'

const DEV_COOKIE = 'qa-session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

export async function getCurrentUser(): Promise<AuthUser | null> {
  const mode = getAuthMode()
  if (mode === 'clerk') {
    return getCurrentUserClerk()
  }
  return getCurrentUserDev()
}

async function getCurrentUserDev(): Promise<AuthUser | null> {
  const store = await cookies()
  const sessionId = store.get(DEV_COOKIE)?.value
  if (!sessionId) return null
  const rows = await db.select().from(users).where(eq(users.devSessionId, sessionId)).limit(1)
  const row = rows[0]
  if (!row) return null
  return toAuthUser(row)
}

async function getCurrentUserClerk(): Promise<AuthUser | null> {
  // Lazy import so dev mode doesn't crash if @clerk/nextjs isn't installed in the deployment image.
  let clerkAuth: { userId: string | null } | null = null
  try {
    const { auth } = await import('@clerk/nextjs/server')
    clerkAuth = await auth()
  } catch {
    return null
  }
  const clerkId = clerkAuth?.userId
  if (!clerkId) return null

  // Upsert the user keyed by clerk_id.
  const existing = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  const existingRow = existing[0]
  if (existingRow) return toAuthUser(existingRow)

  const handle = `@user-${clerkId.slice(0, 8)}`
  const inserted = await db
    .insert(users)
    .values({ clerkId, handle, displayName: 'New User', locale: 'zh' })
    .returning()
  const insertedRow = inserted[0]
  if (!insertedRow) {
    throw new Error('Failed to upsert Clerk user')
  }
  return toAuthUser(insertedRow)
}

function toAuthUser(row: typeof users.$inferSelect): AuthUser {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.displayName,
    locale: row.locale === 'en' ? 'en' : 'zh',
    createdAt: row.createdAt,
  }
}

// --- server actions ---

export async function signInAsTestUser(displayName?: string): Promise<AuthUser> {
  const mode = getAuthMode()
  if (mode !== 'dev') {
    throw new Error('signInAsTestUser is only available in dev mode')
  }
  const store = await cookies()
  let sessionId = store.get(DEV_COOKIE)?.value
  if (!sessionId) {
    sessionId = randomUUID()
    store.set(DEV_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })
  }

  const existing = await db.select().from(users).where(eq(users.devSessionId, sessionId)).limit(1)
  const existingRow = existing[0]
  if (existingRow) return toAuthUser(existingRow)

  const handle = `@test-${sessionId.slice(0, 8)}`
  const name = displayName ?? 'Test User'
  const inserted = await db
    .insert(users)
    .values({ devSessionId: sessionId, handle, displayName: name, locale: 'zh' })
    .returning()
  const insertedRow = inserted[0]
  if (!insertedRow) {
    throw new Error('Failed to insert dev test user')
  }
  return toAuthUser(insertedRow)
}

export async function signOut(): Promise<void> {
  const mode = getAuthMode()
  if (mode === 'dev') {
    const store = await cookies()
    store.delete(DEV_COOKIE)
    return
  }
  // Clerk-mode sign-out is initiated by the Clerk client widget; no server-side action needed.
}

export { getAuthMode }
