import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const url = process.env.QA_DATABASE_URL ?? 'postgres://qa:qa@localhost:5432/qa'

declare global {
  // eslint-disable-next-line no-var
  var __qaDbClient: ReturnType<typeof postgres> | undefined
}

const queryClient = globalThis.__qaDbClient ?? postgres(url, { max: 10 })
if (process.env.NODE_ENV !== 'production') {
  globalThis.__qaDbClient = queryClient
}

export const db = drizzle(queryClient, { schema })
export type Db = typeof db
export * from './schema'
