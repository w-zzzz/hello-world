import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Visualizations sync internal training/animation state to external prop
      // (dataset, landscape, etc.) changes inside effects — this is intentional.
      "react-hooks/set-state-in-effect": "off",
      // React Compiler flags hot interactive viz code (raycaster setHovered in
      // useFrame, instanced mesh updates) where its optimizations would skip.
      // These are intentional perf paths, not bugs.
      "react-hooks/react-compiler": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
]);

export default eslintConfig;
