import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import seatbelt from "eslint-seatbelt";
import importX from "eslint-plugin-import-x";

const eslintConfig = defineConfig([
  seatbelt.configs.enable,
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Convex code — not source. eslint-plugin-react@7.37.5
    // also crashes on these files with `contextOrFilename.getFilename
    // is not a function` (uses an ESLint 8-era API removed in flat
    // config). Ignoring fixes the crash AND removes meaningless lint
    // noise on machine-generated declarations.
    "convex/_generated/**",
  ]),
  // Pin the React version explicitly so eslint-plugin-react@7.37.5 does
  // not call context.getFilename() (removed in ESLint 10 flat config).
  // Without this, react/* rules crash on every .ts file during init.
  {
    settings: {
      react: { version: "19.0" },
    },
  },
  // GOOD-CODE.md §ESLint — enforced rules (Phase 1).
  // Mechanizable rules from the playbook plus two additions from the
  // cursor/plugins integration plan (switch-exhaustiveness-check, import/first).
  //
  // Typed-linting notes:
  //   @typescript-eslint/no-floating-promises and switch-exhaustiveness-check
  //   are type-aware and require parserOptions.projectService. They are
  //   activated here; if they prove too slow or noisy for the team, move them
  //   to a follow-up PR that benchmarks the overhead.
  {
    files: ["**/*.{ts,tsx,mts}"],
    plugins: {
      "import-x": importX,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "react-hooks/exhaustive-deps": "error",
      "import-x/first": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
]);

export default eslintConfig;
