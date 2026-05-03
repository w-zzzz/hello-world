/**
 * Minimal structured JSON logger.
 *
 * Works in both Node and Edge runtimes (uses only globals available in both).
 * In production each call emits exactly one JSON line to stdout/stderr; in dev
 * it adds a small color prefix for human grep-ability. No deps.
 */

type Level = "info" | "warn" | "error";

type Rest = Record<string, unknown> | undefined;

const isProd = process.env.NODE_ENV === "production";

const COLORS: Record<Level, string> = {
  info: "\x1b[36m", // cyan
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};
const RESET = "\x1b[0m";

function emit(level: Level, msg: string, rest?: Rest) {
  const record = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(rest ?? {}),
  };
  const line = safeStringify(record);
  if (isProd) {
    if (level === "error") {
      console.error(line);
    } else {
      console.log(line);
    }
    return;
  }
  // Dev: human-friendly prefix in front of the JSON. Keep the JSON intact so
  // tooling that pipes through `jq` can still parse it after stripping ANSI.
  const prefix = `${COLORS[level]}[${level}]${RESET}`;
  if (level === "error") {
    console.error(`${prefix} ${line}`);
  } else {
    console.log(`${prefix} ${line}`);
  }
}

function safeStringify(o: unknown): string {
  try {
    return JSON.stringify(o);
  } catch {
    // Rare circular refs; fall back so logging never throws.
    return JSON.stringify({ ts: new Date().toISOString(), level: "error", msg: "logger:unserializable" });
  }
}

export const logger = {
  info(msg: string, rest?: Rest) {
    emit("info", msg, rest);
  },
  warn(msg: string, rest?: Rest) {
    emit("warn", msg, rest);
  },
  error(msg: string, rest?: Rest) {
    emit("error", msg, rest);
  },
};
