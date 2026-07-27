// PKGE-HAZARD-1: the Trigger.dev tasks must not reach the in-memory store.
//
// Follows the lib/dev-hq/review-scope.test.ts idiom — read source, assert on what
// it references — because the invariant is about the shape of the import graph,
// not about runtime behaviour.
//
// The hazard is quiet, which is why it needs a guard rather than a comment. The
// worker runs in a different process from the Next.js server that owns the store.
// An import that reached lib/dev-hq/store would not fail: it would give the
// worker its own freshly-seeded copy, and every read against it would return
// plausible, empty, wrong answers. The tasks therefore reach Dev HQ state only
// over the guarded internal HTTP callbacks, and may import nothing but pure
// helpers and types.
//
// The whole transitive closure is walked, not just the direct imports, because a
// one-line re-export is exactly how this boundary would erode.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");

/** Worker-side entry points. Each is a task that runs off-process. */
const WORKER_ENTRY_POINTS = [
  "trigger/founder-request-continuation.ts",
  "trigger/founder-request-workflow.ts",
];

/** Modules no worker-side import graph may reach, at any depth. */
const FORBIDDEN_MODULES = [
  "lib/dev-hq/store.ts",
  "lib/dev-hq/adapters/index.ts",
  "lib/dev-hq/founder-request-service.ts",
];

const IMPORT_PATTERN =
  /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*["']([^"']+)["']/g;

function resolveModule(specifier: string, fromFile: string): string | null {
  let rel: string;
  if (specifier.startsWith("@/")) {
    rel = specifier.slice(2);
  } else if (specifier.startsWith(".")) {
    rel = path
      .relative(ROOT, path.resolve(path.dirname(path.join(ROOT, fromFile)), specifier))
      .split(path.sep)
      .join("/");
  } else {
    // A package import. Out of scope: the hazard is Dev HQ's own store, and a
    // third-party package cannot reach it.
    return null;
  }

  for (const candidate of [rel, `${rel}.ts`, `${rel}.tsx`, `${rel}/index.ts`]) {
    if (fs.existsSync(path.join(ROOT, candidate))) {
      const stat = fs.statSync(path.join(ROOT, candidate));
      if (stat.isFile()) return candidate;
    }
  }
  return null;
}

/** Every local module reachable from `entry`, with the path that reached it. */
function closureOf(entry: string): Map<string, string[]> {
  const reached = new Map<string, string[]>();
  const queue: Array<{ file: string; chain: string[] }> = [
    { file: entry, chain: [entry] },
  ];

  while (queue.length > 0) {
    const { file, chain } = queue.shift()!;
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    for (const match of source.matchAll(IMPORT_PATTERN)) {
      const resolved = resolveModule(match[1], file);
      if (!resolved || reached.has(resolved)) continue;
      const nextChain = [...chain, resolved];
      reached.set(resolved, nextChain);
      queue.push({ file: resolved, chain: nextChain });
    }
  }
  return reached;
}

describe("PKGE-HAZARD-1: worker import boundary", () => {
  it("actually resolves imports, so it cannot pass vacuously", () => {
    for (const entry of WORKER_ENTRY_POINTS) {
      expect(fs.existsSync(path.join(ROOT, entry)), `${entry} is missing`).toBe(
        true,
      );
    }
    // The continuation imports two local helpers. If resolution silently
    // returned nothing, every assertion below would pass against an empty set.
    const closure = closureOf("trigger/founder-request-continuation.ts");
    expect(closure.size).toBeGreaterThan(0);
    expect([...closure.keys()]).toContain("lib/dev-hq/constants.ts");
    expect([...closure.keys()]).toContain("lib/dev-hq/internal-headers.ts");
  });

  it("proves the walker follows transitive imports, not just direct ones", () => {
    // constants.ts re-exports from internal-guard.ts, which the entry point never
    // names. Reaching it is what shows the closure is transitive — and it is also
    // the shape a regression would take.
    const closure = closureOf("trigger/founder-request-continuation.ts");
    const guard = closure.get("lib/dev-hq/internal-guard.ts");
    expect(guard, "internal-guard.ts was not reached transitively").toBeDefined();
    expect(guard!.length).toBeGreaterThan(2);
  });

  it("reaches no Dev HQ state module from any worker entry point", () => {
    for (const entry of WORKER_ENTRY_POINTS) {
      const closure = closureOf(entry);
      for (const forbidden of FORBIDDEN_MODULES) {
        const chain = closure.get(forbidden);
        expect(
          chain,
          chain ? `${entry} reaches ${forbidden} via ${chain.join(" -> ")}` : "",
        ).toBeUndefined();
      }
    }
  });

  it("keeps the continuation's own imports to pure helpers and types", () => {
    const source = fs.readFileSync(
      path.join(ROOT, "trigger/founder-request-continuation.ts"),
      "utf8",
    );
    const specifiers = [...source.matchAll(IMPORT_PATTERN)].map((m) => m[1]);
    expect(specifiers).toEqual([
      "@trigger.dev/sdk",
      "@/lib/dev-hq/constants",
      "@/lib/dev-hq/internal-headers",
    ]);
  });

  it("reaches Dev HQ state only over the guarded internal callbacks", () => {
    const source = fs.readFileSync(
      path.join(ROOT, "trigger/founder-request-continuation.ts"),
      "utf8",
    );
    expect(source).toContain("/api/dev-hq/internal/finalize");
    expect(source).toContain("getDevHqInternalHeaders");
    // No direct adapter or store access, however it might be spelled.
    for (const forbidden of [
      "getDevHqStore",
      "getDevHqAdapters",
      "buildDevHqState",
      "resetDevHqStore",
    ]) {
      expect(source.includes(forbidden), `references ${forbidden}`).toBe(false);
    }
  });
});
