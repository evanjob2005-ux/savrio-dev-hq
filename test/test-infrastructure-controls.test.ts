import { chmod, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { configDefaults } from "vitest/config";

import playwrightConfig from "@/playwright.config";
import {
  DEFAULT_E2E_PORT,
  DEFAULT_E2E_TRIGGER_PORT,
  resolveE2EPorts,
} from "@/test/playwright-config";
import vitestConfig from "@/vitest.config";

type YamlModule = {
  load(source: string, options?: { json?: boolean }): unknown;
};

const { load: loadYaml } = createRequire(import.meta.url)(
  "js-yaml",
) as YamlModule;
const createdE2EProbeDirectories: string[] = [];
const frontendWorkflowPath = path.resolve(
  ".github/workflows/frontend-tests.yml",
);
const repositoryHygieneVerifierPath = path.resolve(
  "scripts/verify-repository-hygiene.mjs",
);

function workflowJob(source: string, jobName: string): string | undefined {
  const marker = `\n  ${jobName}:\n`;
  const start = `\n${source}`.indexOf(marker);
  if (start === -1) return undefined;
  const bodyStart = start + marker.length;
  const remainder = `\n${source}`.slice(bodyStart);
  const nextJob = remainder.search(/\n  [A-Za-z0-9_-]+:\n/);
  return remainder.slice(0, nextJob === -1 ? undefined : nextJob);
}

function workflowStep(
  job: string,
  stepName: string,
): string | undefined {
  const marker = `      - name: ${stepName}\n`;
  const start = job.indexOf(marker);
  if (start === -1) return undefined;
  const nextStep = job.indexOf("\n      - name: ", start + marker.length);
  return job.slice(start, nextStep === -1 ? undefined : nextStep);
}

function isStringKeyedMapping(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function workflowRootMappingScalar(
  source: string,
  mappingName: string,
  scalarName: string,
): string | undefined {
  let workflow: unknown;
  try {
    // js-yaml rejects duplicate mapping keys unless json:true is supplied.
    // Keep that relaxation explicitly disabled: duplicate root mappings or
    // duplicate scalars are ambiguous controls and must fail evaluation.
    workflow = loadYaml(source, { json: false });
  } catch {
    return undefined;
  }
  if (!isStringKeyedMapping(workflow)) return undefined;
  const mapping = workflow[mappingName];
  if (!isStringKeyedMapping(mapping)) return undefined;
  const scalar = mapping[scalarName];
  return typeof scalar === "string" ? scalar : undefined;
}

function frontendWorkflowPolicyErrors(source: string): string[] {
  const errors: string[] = [];
  const expectedGroup =
    "frontend-tests-${{ github.workflow }}-${{ github.event_name }}-${{ github.ref }}";
  if (
    workflowRootMappingScalar(source, "concurrency", "group") !==
    expectedGroup
  ) {
    errors.push("concurrency group does not isolate workflow events");
  }
  for (const staleClaim of [
    "all executed unconditionally",
    "Chromium and OS dependencies installed on every run",
    "Playwright executed with the committed webServer configuration",
  ]) {
    if (source.includes(staleClaim)) {
      errors.push(`job summary overclaims execution: ${staleClaim}`);
    }
  }
  for (const jobName of ["unit", "e2e"]) {
    const job = workflowJob(source, jobName);
    const hygiene = job
      ? workflowStep(job, "Verify repository hygiene")
      : undefined;
    if (!hygiene) {
      errors.push(`${jobName} hygiene step is missing`);
    } else if (
      !/^        if: \$\{\{ !cancelled\(\) \}\}\s*$/m.test(hygiene)
    ) {
      errors.push(`${jobName} hygiene is not cancellation-aware`);
    }
    const verifierInvocations =
      hygiene?.match(
        /^          node scripts\/verify-repository-hygiene\.mjs\s*$/gm,
      ) ?? [];
    if (verifierInvocations.length !== 1) {
      errors.push(`${jobName} hygiene does not execute the shared verifier`);
    }
  }

  const e2e = workflowJob(source, "e2e");
  const upload = e2e
    ? workflowStep(e2e, "Upload Playwright failure artifacts")
    : undefined;
  if (!upload) {
    errors.push("failure-artifact upload step is missing");
  } else if (!/^          if-no-files-found: warn\s*$/m.test(upload)) {
    errors.push("missing failure artifacts do not warn");
  }
  return errors;
}

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
    omitFile?: "playwright.config.ts";
    directoryBinary?: "playwright" | "next";
    directoryFile?: "playwright.config.ts";
    nonExecutableBinary?: "playwright" | "next";
  }) {
    const root = await mkdtemp(path.join(os.tmpdir(), "savrio-e2e-precondition-"));
    try {
      await mkdir(path.join(root, "node_modules", ".bin"), { recursive: true });
      for (const file of ["playwright.config.ts"] as const) {
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
        frontendWorkflowPath,
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

  it.each(["playwright.config.ts"] as const)(
    "fails when the workflow-declared %s file is absent",
    async (file) => {
      const result = await runPrecondition({ omitFile: file });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(file);
    },
  );

  it.each(["playwright.config.ts"] as const)(
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

describe("frontend workflow cancellation and failure diagnostics", () => {
  const workflow = readFileSync(frontendWorkflowPath, "utf8");

  it("keeps both hygiene steps cancellation-aware and warns when failure artifacts are absent", () => {
    expect(frontendWorkflowPolicyErrors(workflow)).toEqual([]);
  });

  it("goes red if either hygiene guard regresses to always()", () => {
    const mutated = workflow.replaceAll(
      "if: ${{ !cancelled() }}",
      "if: always()",
    );
    expect(mutated).not.toBe(workflow);
    expect(frontendWorkflowPolicyErrors(mutated)).toEqual([
      "unit hygiene is not cancellation-aware",
      "e2e hygiene is not cancellation-aware",
    ]);
  });

  it("goes red if a hygiene verifier invocation is removed", () => {
    const mutated = workflow.replace(
      "          node scripts/verify-repository-hygiene.mjs\n",
      "",
    );
    expect(mutated).not.toBe(workflow);
    expect(frontendWorkflowPolicyErrors(mutated)).toEqual([
      "unit hygiene does not execute the shared verifier",
    ]);
  });

  it("goes red if hygiene is weakened to ignore verifier failure", () => {
    const mutated = workflow.replaceAll(
      "node scripts/verify-repository-hygiene.mjs",
      "node scripts/verify-repository-hygiene.mjs || true",
    );
    expect(mutated).not.toBe(workflow);
    expect(frontendWorkflowPolicyErrors(mutated)).toEqual([
      "unit hygiene does not execute the shared verifier",
      "e2e hygiene does not execute the shared verifier",
    ]);
  });

  it("goes red if workflow events are removed from the concurrency group", () => {
    const mutated = workflow.replace(
      "-${{ github.event_name }}-${{ github.ref }}",
      "-${{ github.ref }}",
    );
    expect(mutated).not.toBe(workflow);
    expect(frontendWorkflowPolicyErrors(mutated)).toEqual([
      "concurrency group does not isolate workflow events",
    ]);
  });

  it("goes red if a decoy exact group hides a bad root concurrency group", () => {
    const expectedGroup =
      "group: frontend-tests-${{ github.workflow }}-${{ github.event_name }}-${{ github.ref }}";
    const mutatedRoot = workflow.replace(
      expectedGroup,
      "group: frontend-tests-bad-root-group",
    );
    expect(mutatedRoot).not.toBe(workflow);
    const mutated = `${mutatedRoot}\ndecoy: |\n  ${expectedGroup}\n`;
    expect(frontendWorkflowPolicyErrors(mutated)).toEqual([
      "concurrency group does not isolate workflow events",
    ]);
  });

  it("goes red on a comment-bearing duplicate root concurrency mapping", () => {
    const mutated = `${workflow}\nconcurrency: # duplicate root is ambiguous\n  group: frontend-tests-bad-duplicate\n`;
    expect(frontendWorkflowPolicyErrors(mutated)).toEqual([
      "concurrency group does not isolate workflow events",
    ]);
  });

  it("goes red on a quoted duplicate root concurrency mapping", () => {
    const mutated = `${workflow}\n"concurrency":\n  group: frontend-tests-bad-quoted-duplicate\n`;
    expect(frontendWorkflowPolicyErrors(mutated)).toEqual([
      "concurrency group does not isolate workflow events",
    ]);
  });

  it("goes red if the root concurrency mapping has a quoted duplicate group", () => {
    const expectedGroup =
      "  group: frontend-tests-${{ github.workflow }}-${{ github.event_name }}-${{ github.ref }}";
    const mutated = workflow.replace(
      expectedGroup,
      `${expectedGroup}\n  "group": frontend-tests-bad-duplicate`,
    );
    expect(mutated).not.toBe(workflow);
    expect(frontendWorkflowPolicyErrors(mutated)).toEqual([
      "concurrency group does not isolate workflow events",
    ]);
  });

  it("goes red if missing failure artifacts regress to ignore", () => {
    const mutated = workflow.replace(
      "if-no-files-found: warn",
      "if-no-files-found: ignore",
    );
    expect(mutated).not.toBe(workflow);
    expect(frontendWorkflowPolicyErrors(mutated)).toEqual([
      "missing failure artifacts do not warn",
    ]);
  });

  it("goes red if a job summary claims skipped validation executed", () => {
    const mutated = workflow.replace(
      "Earlier validation results and skips remain authoritative in their own step statuses",
      "Type check, lint, Vitest node, Vitest DOM, aggregate npm test and build all executed unconditionally",
    );
    expect(mutated).not.toBe(workflow);
    expect(frontendWorkflowPolicyErrors(mutated)).toEqual([
      "job summary overclaims execution: all executed unconditionally",
    ]);
  });
});

describe("repository hygiene verifier", () => {
  function runNormalizerProbe(
    result: { status: number; stdout: string; stderr: string },
  ) {
    const moduleUrl = JSON.stringify(
      pathToFileURL(repositoryHygieneVerifierPath).href,
    );
    const probe = `
      import { normalizeDiffCheckResult } from ${moduleUrl};
      const normalized = normalizeDiffCheckResult(${JSON.stringify(result)});
      console.log(JSON.stringify(normalized));
      process.exitCode = normalized.status;
    `;
    return spawnSync(
      process.execPath,
      ["--input-type=module", "--eval", probe],
      { cwd: process.cwd(), encoding: "utf8" },
    );
  }

  async function runHygieneProbe(
    mutation: "clean" | "tracked" | "untracked" | "whitespace",
  ) {
    const root = await mkdtemp(path.join(os.tmpdir(), "savrio-hygiene-"));
    const runGit = (args: string[]) =>
      spawnSync("git", args, { cwd: root, encoding: "utf8" });
    try {
      expect(runGit(["init"]).status).toBe(0);
      expect(runGit(["config", "core.autocrlf", "false"]).status).toBe(0);
      expect(
        runGit([
          "config",
          "core.excludesFile",
          path.join(root, ".git", "info", "exclude"),
        ]).status,
      ).toBe(0);
      await writeFile(path.join(root, "tracked.txt"), "baseline\n", "utf8");
      expect(runGit(["add", "tracked.txt"]).status).toBe(0);
      const committed = runGit([
        "-c",
        "user.name=Savrio Test",
        "-c",
        "user.email=test@example.invalid",
        "commit",
        "-m",
        "baseline",
      ]);
      expect(committed.status, committed.stderr || committed.stdout).toBe(0);

      if (mutation === "tracked") {
        await writeFile(path.join(root, "tracked.txt"), "changed\n", "utf8");
      } else if (mutation === "untracked") {
        await writeFile(path.join(root, "untracked.txt"), "unexpected\n", "utf8");
      } else if (mutation === "whitespace") {
        await writeFile(path.join(root, "tracked.txt"), "trailing spaces  \n", "utf8");
      }

      return spawnSync(
        process.execPath,
        [repositoryHygieneVerifierPath, "--root", root],
        { cwd: process.cwd(), encoding: "utf8" },
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }

  it("passes its clean null arm", async () => {
    const result = await runHygieneProbe("clean");
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain("working tree is clean");
  });

  it("fails on a tracked modification through the production verifier", async () => {
    const result = await runHygieneProbe("tracked");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("tracked.txt");
  });

  it("fails on an untracked file through the production verifier", async () => {
    const result = await runHygieneProbe("untracked");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("untracked.txt");
  });

  it("classifies whitespace findings as a property violation", async () => {
    const result = await runHygieneProbe("whitespace");
    expect(result.status, result.stderr || result.stdout).toBe(1);
    expect(result.stderr).toContain("whitespace errors");
    expect(result.stderr).toContain("tracked.txt");
  });

  it("classifies a real operational failure as could-not-evaluate", () => {
    const missingRoot = path.join(
      os.tmpdir(),
      `savrio-hygiene-missing-${process.pid}-${Date.now()}`,
    );
    const result = spawnSync(
      process.execPath,
      [repositoryHygieneVerifierPath, "--root", missingRoot],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("could not resolve HEAD");
  });

  it("classifies a terminated git diff as could-not-evaluate", () => {
    const moduleUrl = JSON.stringify(
      pathToFileURL(repositoryHygieneVerifierPath).href,
    );
    const probe = `
      import { verifyRepositoryHygiene } from ${moduleUrl};
      const runGit = (_root, args) =>
        args[0] === "rev-parse"
          ? { status: 0, stdout: "head", stderr: "" }
          : { status: null, stdout: "", stderr: "simulated termination" };
      const result = verifyRepositoryHygiene(".", runGit);
      for (const message of result.messages) console.error(message);
      process.exitCode = result.status;
    `;
    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "--eval", probe],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("simulated termination");
  });

  it("normalizes a recognized Linux diff-check diagnostic to 1", () => {
    const result = runNormalizerProbe({
      status: 2,
      stdout: "tracked.txt:1: trailing whitespace.\n+trailing spaces  \n",
      stderr: "",
    });
    expect(result.status, result.stderr || result.stdout).toBe(1);
  });

  it("does not normalize Linux status 2 with arbitrary stdout", () => {
    const result = runNormalizerProbe({
      status: 2,
      stdout: "unexpected but nonempty output\n",
      stderr: "",
    });
    expect(result.status, result.stderr || result.stdout).toBe(2);
  });

  it("does not normalize Windows status 2 with arbitrary stdout", () => {
    const result = runNormalizerProbe({
      status: 2,
      stdout: "unexpected but nonempty output\n",
      stderr: "",
    });
    expect(result.status, result.stderr || result.stdout).toBe(2);
  });

  it("normalizes only a recognized Windows diff-check diagnostic to 1", () => {
    const result = runNormalizerProbe({
      status: 2,
      stdout: "tracked.txt:1: trailing whitespace.\n+trailing spaces  \n",
      stderr: "",
    });
    expect(result.status, result.stderr || result.stdout).toBe(1);
  });

  it("normalizes a recognized leftover conflict marker diagnostic to 1", () => {
    const result = runNormalizerProbe({
      status: 2,
      stdout: "tracked.txt:3: leftover conflict marker\n+<<<<<<< HEAD\n",
      stderr: "",
    });
    expect(result.status, result.stderr || result.stdout).toBe(1);
  });

  it("does not normalize status 2 with mixed recognized and arbitrary stdout", () => {
    const result = runNormalizerProbe({
      status: 2,
      stdout:
        "tracked.txt:1: trailing whitespace.\n+trailing spaces  \nunexpected output\n",
      stderr: "",
    });
    expect(result.status, result.stderr || result.stdout).toBe(2);
  });

  it("does not normalize status 2 when stderr has an operational diagnostic", () => {
    const result = runNormalizerProbe({
      status: 2,
      stdout: "tracked.txt:1: trailing whitespace.\n+trailing spaces  \n",
      stderr: "fatal: simulated operational failure\n",
    });
    expect(result.status, result.stderr || result.stdout).toBe(2);
  });
});
