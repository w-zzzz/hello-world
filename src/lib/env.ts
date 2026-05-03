import { z } from "zod";

/**
 * Process-env validation. Imported eagerly by `src/lib/db.ts`, so any code path
 * that touches the DB will fail fast with a descriptive error rather than
 * surfacing as a confusing Prisma error mid-request.
 *
 * Keep this module side-effecting on purpose: throw at import time.
 */

const EnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (v) => v.startsWith("file:") || v.startsWith("postgresql:") || v.startsWith("postgres:"),
      "DATABASE_URL must start with `file:` (SQLite) or `postgresql:`/`postgres:` (Postgres)",
    ),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  // Flatten for a readable startup error.
  const flat = parsed.error.flatten();
  const lines = Object.entries(flat.fieldErrors)
    .map(([k, v]) => `  - ${k}: ${(v ?? []).join("; ")}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${lines}`);
}

export const env: Env = parsed.data;
