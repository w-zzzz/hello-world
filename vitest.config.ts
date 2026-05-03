import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` is a Next.js bundler hint; in unit tests we stub it out
      // so that server modules (e.g. `src/lib/mdx.ts`) can be exercised
      // directly for schema-validation tests.
      "server-only": path.resolve(__dirname, "tests/_stubs/server-only.ts"),
    },
  },
});
