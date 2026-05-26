import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.QA_DATABASE_URL ?? 'postgres://qa:qa@localhost:5432/qa',
  },
} satisfies Config
