import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const url = process.env.QA_DATABASE_URL ?? 'postgres://qa:qa@localhost:5432/qa'
const migrationsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../migrations')

async function run() {
  const sql = postgres(url, { max: 1 })
  const db = drizzle(sql)
  console.log(`Applying migrations from ${migrationsDir}…`)
  await migrate(db, { migrationsFolder: migrationsDir })
  await sql.end()
  console.log('Migrations applied.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
