// P-1 D-2: structural inventory of every wait.* call site in production source.
//
// Follows the lib/dev-hq/review-scope.test.ts idiom — read source, assert on what
// it references — because the invariant is about the shape of the repository, not
// about runtime behaviour.
//
// Exactly five wait.* sites exist: three wait.completeToken, one wait.createToken,
// one wait.forToken. P-2 removes or relocates these. This test fails if any is
// added or removed, so that change is deliberate and visible rather than silent.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");

/** Directories holding production source. */
const SOURCE_DIRS = ["app", "components", "data", "lib", "trigger", "types"];

const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".trigger",
  "e2e",
  "test",
]);

const SERVICE = "lib/dev-hq/founder-request-service.ts";
const WORKFLOW = "trigger/founder-request-workflow.ts";

interface WaitSite {
  file: string;
  line: number;
  method: string;
}

/** Production source only: test files are excluded so this file cannot count itself. */
function isProductionSource(name: string): boolean {
  if (!/\.(ts|tsx)$/.test(name)) return false;
  if (/\.test\.tsx?$/.test(name)) return false;
  if (/\.d\.ts$/.test(name)) return false;
  return true;
}

function walk(dir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (isProductionSource(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
}

function collectSourceFiles(): string[] {
  const files: string[] = [];
  // Root-level modules (trigger.config.ts, proxy.ts, middleware.ts, ...) as well
  // as the source trees, so a wait.* call added at the root is still caught.
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (entry.isFile() && isProductionSource(entry.name)) {
      files.push(path.join(ROOT, entry.name));
    }
  }
  for (const dir of SOURCE_DIRS) {
    const abs = path.join(ROOT, dir);
    if (fs.existsSync(abs)) walk(abs, files);
  }
  return files;
}

function scan(): { files: string[]; sites: WaitSite[] } {
  const files = collectSourceFiles().map((file) =>
    path.relative(ROOT, file).split(path.sep).join("/"),
  );
  const sites: WaitSite[] = [];
  for (const rel of files) {
    const lines = fs
      .readFileSync(path.join(ROOT, rel), "utf8")
      .split(/\r?\n/);
    lines.forEach((text, index) => {
      // Matches wait.method(, including an inline type argument such as
      // wait.completeToken<{ approved: boolean }>(.
      for (const match of text.matchAll(
        /\bwait\.([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*\(/g,
      )) {
        sites.push({ file: rel, line: index + 1, method: match[1] });
      }
    });
  }
  return { files, sites };
}

const { files, sites } = scan();

function sitesFor(method: string): WaitSite[] {
  return sites.filter((site) => site.method === method);
}

describe("wait.* call-site inventory", () => {
  it("actually scans production source, so it cannot pass vacuously", () => {
    // A structural guard whose scan silently returned nothing would pass every
    // assertion below. Prove the scan reached real files first.
    expect(files.length).toBeGreaterThan(10);
    expect(files).toContain(SERVICE);
    expect(files).toContain(WORKFLOW);
    // Test files are excluded, so this file's own literals are never counted.
    expect(files.some((file) => /\.test\.tsx?$/.test(file))).toBe(false);
  });

  it("has exactly three wait.completeToken sites, all in the founder-request service", () => {
    const found = sitesFor("completeToken");
    expect(found).toHaveLength(3);
    expect([...new Set(found.map((site) => site.file))]).toEqual([SERVICE]);
  });

  it("has exactly one wait.createToken site, in the founder-request workflow", () => {
    const found = sitesFor("createToken");
    expect(found).toHaveLength(1);
    expect(found[0].file).toBe(WORKFLOW);
  });

  it("has exactly one wait.forToken site, in the founder-request workflow", () => {
    const found = sitesFor("forToken");
    expect(found).toHaveLength(1);
    expect(found[0].file).toBe(WORKFLOW);
  });

  it("introduces no other wait.* primitive anywhere in production source", () => {
    expect([...new Set(sites.map((site) => site.method))].sort()).toEqual([
      "completeToken",
      "createToken",
      "forToken",
    ]);
    expect(sites).toHaveLength(5);
  });

  it("records the line locations as they stand at this commit", () => {
    // Kept separate from the count invariants above so an unrelated line shift in
    // either file is distinguishable from a call site being added or removed.
    expect(sites).toEqual([
      { file: SERVICE, line: 465, method: "completeToken" },
      { file: SERVICE, line: 489, method: "completeToken" },
      { file: SERVICE, line: 528, method: "completeToken" },
      { file: WORKFLOW, line: 69, method: "createToken" },
      { file: WORKFLOW, line: 83, method: "forToken" },
    ]);
  });
});
