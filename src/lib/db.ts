import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
// `file:./dev.db` style → strip prefix to get raw path
const filename = url.replace(/^file:/, "");

declare global {
  var __prisma: PrismaClient | undefined;
}

function makeClient() {
  const adapter = new PrismaBetterSqlite3({ url: filename });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  (() => {
    const c = makeClient();
    if (process.env.NODE_ENV !== "production") globalThis.__prisma = c;
    return c;
  })();
