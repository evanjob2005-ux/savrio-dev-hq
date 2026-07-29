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
    ".trigger/**",
    // Deliberately defective by design: these are the known-bad inputs the
    // Semgrep positive control scans to prove its rules still detect the
    // defect classes they claim to. Linting them reports real problems that
    // must not be fixed, and they are not application code. They escape tsc
    // only incidentally, because TypeScript's include globs do not descend
    // into dot-directories; this makes the exclusion declared rather than
    // accidental for ESLint too.
    ".semgrep/fixtures/**",
  ]),
]);

export default eslintConfig;
