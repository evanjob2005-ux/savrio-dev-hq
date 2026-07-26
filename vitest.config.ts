import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = {
  "@": path.resolve(__dirname, "."),
};

// Two isolated projects. The "node" project reproduces the pre-existing
// configuration exactly (environment, include glob, mock behavior) so the
// regression baseline is unaffected; "dom" is additive and only ever collects
// .test.tsx files. Vitest 4 removed vitest.workspace.ts, so the split is
// expressed with test.projects here.
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
          setupFiles: ["./test/setup-dom.ts"],
          clearMocks: true,
          restoreMocks: true,
        },
      },
    ],
  },
});
