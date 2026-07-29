import { chmod, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { configDefaults } from "vitest/config";

import playwrightConfig from "@/playwright.config";
import {
  DEFAULT_E2E_PORT,
  DEFAULT_E2E_TRIGGER_PORT,
  resolveE2EPorts,
} from "@/test/playwright-config";
import vitestConfig from "@/vitest.config";

const createdE2EProbeDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    createdE2EProbeDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("Playwright port configuration", () => {
  it("uses distinct stable defaults and accepts explicit valid ports", () => {
    expect(resolveE2EPorts({})).toEqual({
      app: DEFAULT_E2E_PORT,
      triggerStub: DEFAULT_E2E_TRIGGER_PORT,
    });
    expect(
      resolveE2EPorts({
        E2E_PORT: "1",
        E2E_TRIGGER_PORT: "65535",
      }),
    ).toEqual({ app: 1, triggerStub: 65_535 });
  });

  it.each([
    ["", "3199"],
    ["0", "3199"],
    ["-1", "3199"],
    ["3100.0", "3199"],
    [" 3100", "3199"],
    ["abc", "3199"],
    ["0x0c1c", "3199"],
    ["65536", "3199"],
    ["3100", ""],
    ["3100", "0"],
    ["3100", " 3199"],
    ["3100", "3e3"],
    ["3100", "0xc7f"],
    ["3100", "65536"],
  ])(
    "rejects invalid E2E_PORT=%j / E2E_TRIGGER_PORT=%j clearly",
    (app, triggerStub) => {
      expect(() =>
        resolveE2EPorts({
          E2E_PORT: app,
          E2E_TRIGGER_PORT: triggerStub,
        }),
      ).toThrow(/must be a base-10 integer between 1 and 65535/);
    },
  );

  it("rejects a collision between the application and Trigger stub", () => {
    expect(() =>
      resolveE2EPorts({
        E2E_PORT: "4100",
        E2E_TRIGGER_PORT: "4100",
      }),
    ).toThrow(/must be different; both resolved to 4100/);
  });
});

describe("test discovery configuration", () => {
  it("composes every installed Vitest default and project exclusion in both projects", () => {
    const projects = vitestConfig.test?.projects;
    expect(Array.isArray(projects)).toBe(true);
    expect(projects).toHaveLength(2);
    expect(
      new Set(
        (projects as Array<{ test?: { name?: string } }>).map(
          (project) => project.test?.name,
        ),
      ),
    ).toEqual(new Set(["node", "dom"]));
    for (const project of projects as Array<{
      test?: { name?: string; exclude?: string[] };
    }>) {
      expect(["node", "dom"]).toContain(project.test?.name);
      expect(project.test?.exclude).toEqual(
        expect.arrayContaining([
          ...configDefaults.exclude,
          "**/dist/**",
          "**/.next/**",
          "e2e/**",
        ]),
      );
    }
  });

  it("collects supported .spec forms and rejects .test forms through the real Playwright CLI", async () => {
    const e2eRoot = path.resolve("e2e");
    const probeDirectory = await mkdtemp(
      path.join(e2eRoot, ".collection-probe-"),
    );
    createdE2EProbeDirectories.push(probeDirectory);
    const probePrefix = path
      .relative(e2eRoot, probeDirectory)
      .replaceAll("\\", "/");
    const supportedExtensions = [
      "ts",
      "js",
      "jsx",
      "cjs",
      "cjsx",
      "cts",
      "ctsx",
      "mjs",
      "mjsx",
      "mts",
      "mtsx",
      "tsx",
    ] as const;
    const cases: Array<readonly [string, boolean]> = [
      ...supportedExtensions.map(
        (extension) =>
          [`collection-probe.spec.${extension}`, true] as const,
      ),
      ["collection-probe.test.cjs", false],
      ["collection-probe.test.mts", false],
      ["collection-probe.test.ts", false],
      ["collection-probe.test.tsx", false],
    ];
    for (const [name] of cases) {
      const target = path.join(probeDirectory, name);
      const commonJs = /\.(?:cjs|cjsx|cts|ctsx|js|jsx)$/.test(name);
      await writeFile(
        target,
        (commonJs
          ? 'const { test } = require("@playwright/test");\n'
          : 'import { test } from "@playwright/test";\n') +
          `test(${JSON.stringify(name)}, async () => {});\n`,
        "utf8",
      );
    }

    const listed = spawnSync(
      process.execPath,
      [path.resolve("node_modules/@playwright/test/cli.js"), "test", "--list"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );
    expect(listed.status, listed.stderr || listed.stdout).toBe(0);
    const listedFiles = new Set(
      listed.stdout
        .split(/\r?\n/)
        .map((line) =>
          line.match(/^\s*\[[^\]]+\]\s+›\s+(.+?):\d+:\d+\s+›/)?.[1]
            ?.replaceAll("\\", "/"),
        )
        .filter((name): name is string => Boolean(name)),
    );
    for (const [name, shouldCollect] of cases) {
      const expectedPath = `${probePrefix}/${name}`;
      expect(
        listedFiles.has(expectedPath),
        `${expectedPath} should ${shouldCollect ? "" : "not "}be collected`,
      ).toBe(shouldCollect);
    }
    expect(playwrightConfig.testMatch).toBe("**/*.spec.?(c|m)[jt]s?(x)");
  });
});

describe("frontend E2E workflow precondition", () => {
  async function runPrecondition(options?: {
    omitBinary?: "playwright" | "next";
    omitFile?: "playwright.config.ts" | "e2e/smoke.spec.ts";
    directoryBinary?: "playwright" | "next";
    directoryFile?: "playwright.config.ts" | "e2e/smoke.spec.ts";
    nonExecutableBinary?: "playwright" | "next";
  }) {
    const root = await mkdtemp(path.join(os.tmpdir(), "savrio-e2e-precondition-"));
    try {
      await mkdir(path.join(root, "e2e"), { recursive: true });
      await mkdir(path.join(root, "node_modules", ".bin"), { recursive: true });
      for (const file of [
        "playwright.config.ts",
        "e2e/smoke.spec.ts",
      ] as const) {
        if (file === options?.omitFile) continue;
        const target = path.join(root, file);
        if (file === options?.directoryFile) {
          await mkdir(target);
        } else {
          await writeFile(target, "fixture\n");
        }
      }
      for (const binary of ["playwright", "next"] as const) {
        if (binary === options?.omitBinary) continue;
        const target = path.join(root, "node_modules", ".bin", binary);
        if (binary === options?.directoryBinary) {
          await mkdir(target);
          continue;
        }
        await writeFile(target, "#!/bin/sh\nexit 0\n");
        await chmod(
          target,
          binary === options?.nonExecutableBinary ? 0o644 : 0o755,
        );
      }

      const workflow = readFileSync(
        path.resolve(".github/workflows/frontend-tests.yml"),
        "utf8",
      );
      const command = workflow.match(
        /- name: Verify harness preconditions\s*\r?\n\s+run:\s*>-\s*\r?\n((?:\s{10,}.+\r?\n?)+)/,
      )?.[1];
      expect(command, "E2E precondition command is missing from the workflow").toBeTruthy();
      const tokens = command!
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ")
        .split(/\s+/);
      const [launcher, script, ...args] = tokens;
      expect(launcher).toBe("node");
      expect(script).toBe("scripts/verify-test-harness-preconditions.mjs");

      const result = spawnSync(
        launcher,
        [
          script,
          "--root",
          root,
          ...args,
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      );
      return result;
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }

  it("passes when every workflow-declared file and local binary is present", async () => {
    const result = await runPrecondition();
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });

  it.each(["playwright", "next"] as const)(
    "fails when the workflow-declared local %s binary is absent",
    async (binary) => {
      const result = await runPrecondition({ omitBinary: binary });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(`node_modules/.bin/${binary}`);
    },
  );

  it.each(["playwright.config.ts", "e2e/smoke.spec.ts"] as const)(
    "fails when the workflow-declared %s file is absent",
    async (file) => {
      const result = await runPrecondition({ omitFile: file });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(file);
    },
  );

  it.each(["playwright.config.ts", "e2e/smoke.spec.ts"] as const)(
    "fails when the workflow-declared %s file path is a directory",
    async (file) => {
      const result = await runPrecondition({ directoryFile: file });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(file);
    },
  );

  it.each(["playwright", "next"] as const)(
    "fails when the workflow-declared local %s binary path is a directory",
    async (binary) => {
      const result = await runPrecondition({ directoryBinary: binary });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(`node_modules/.bin/${binary}`);
    },
  );

  it.skipIf(process.platform === "win32").each([
    "playwright",
    "next",
  ] as const)(
    "fails when the workflow-declared local %s binary is present but not executable",
    async (binary) => {
      const result = await runPrecondition({ nonExecutableBinary: binary });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(`node_modules/.bin/${binary}`);
    },
  );
});
