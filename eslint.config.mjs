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
    // Generated Convex code — not source. eslint-plugin-react@7.37.5
    // also crashes on these files with `contextOrFilename.getFilename
    // is not a function` (uses an ESLint 8-era API removed in flat
    // config). Ignoring fixes the crash AND removes meaningless lint
    // noise on machine-generated declarations.
    "convex/_generated/**",
  ]),
]);

export default eslintConfig;
