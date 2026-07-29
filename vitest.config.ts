import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

const alias = {
  "@": path.resolve(__dirname, "."),
};

const projectExclude = [
  ...configDefaults.exclude,
  "**/dist/**",
  "**/.next/**",
  "e2e/**",
];

// Two isolated projects. The "node" project preserves the baseline environment,
// include glob, and mock behavior while both projects compose Vitest's current
// default exclusions plus repository-specific generated/E2E paths. "dom" is
// additive and only ever collects .test.tsx files. Vitest 4 removed
// vitest.workspace.ts, so the split is expressed with test.projects here.
export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: ["**/*.test.ts"],
          // Compose Vitest's installed-version defaults rather than replacing
          // them with a partial copy. e2e/ belongs to Playwright, while build
          // output must never become input to either test project.
          exclude: [...projectExclude],
          setupFiles: ["./test/setup-node.ts"],
          clearMocks: true,
          restoreMocks: true,
        },
      },
      {
        resolve: { alias },
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["**/*.test.tsx"],
          exclude: [...projectExclude],
          setupFiles: ["./test/setup-dom.ts"],
          clearMocks: true,
          restoreMocks: true,
        },
      },
    ],
  },
});
