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
    // defect classes they claim to. They must never be "fixed", and they are
    // not application code.
    //
    // They report zero problems under the current rule set, so this is not
    // suppressing existing findings -- it is stopping the rule set from ever
    // acquiring an opinion about files whose entire purpose is to be wrong.
    // ESLint's flat config does traverse dot-directories, so without this they
    // are genuinely in scope; these four are the only lintable files in any
    // dot-directory in the repository.
    //
    // Note this declares the exclusion for ESLint only. The equivalent tsc
    // exclusion is still incidental -- TypeScript's include globs happen not to
    // descend into dot-directories -- and remains open as OBL-08.
    ".semgrep/fixtures/**",
  ]),
]);

export default eslintConfig;
