import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from './schema'

const url = process.env.QA_DATABASE_URL ?? 'postgres://qa:qa@localhost:5432/qa'

const DEV_USER_ID = '00000000-0000-4000-8000-000000000001'

async function run() {
  const sql = postgres(url, { max: 1 })
  const db = drizzle(sql)
  console.log('Seeding dev user…')
  await db
    .insert(users)
    .values({
      id: DEV_USER_ID,
      handle: '@dev',
      displayName: 'Test User',
      locale: 'zh',
      devSessionId: 'dev-session-1',
    })
    .onConflictDoNothing()
  await sql.end()
  console.log(`Seed complete (dev user id=${DEV_USER_ID}).`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
