import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DIFF_CHECK_FINDING =
  /^.+:\d+: (?:trailing whitespace\.|space before tab in indent\.|new blank line at EOF\.|blank line at EOF\.|leftover conflict marker)$/;

function isDiffCheckFindingOutput(stdout) {
  const lines = String(stdout ?? "")
    .split(/\r?\n/)
    .filter(Boolean);
  let sawFinding = false;
  let mayHaveExcerpt = false;
  for (const line of lines) {
    if (DIFF_CHECK_FINDING.test(line)) {
      sawFinding = true;
      mayHaveExcerpt = true;
      continue;
    }
    if (mayHaveExcerpt && line.startsWith("+")) {
      mayHaveExcerpt = false;
      continue;
    }
    return false;
  }
  return sawFinding;
}

export function normalizeDiffCheckResult(result) {
  if (
    result.status === 2 &&
    !(result.stderr ?? "").trim() &&
    isDiffCheckFindingOutput(result.stdout)
  ) {
    return { ...result, status: 1 };
  }
  return result;
}

function parseRoot(args) {
  if (args.length === 0) return process.cwd();
  if (args.length === 2 && args[0] === "--root" && args[1]) {
    return path.resolve(args[1]);
  }
  throw new Error(
    "Usage: node scripts/verify-repository-hygiene.mjs [--root PATH]",
  );
}

function git(root, args) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
  });
  // `git diff --check` uses result bit 2 for findings, so a raw status 2
  // can be a property violation on every platform rather than an operational
  // failure. The independently tested normalizer accepts only recognized
  // finding diagnostics with empty stderr; every other result keeps its raw
  // status for the verifier's 0/1/2 classification below.
  if (args[0] === "diff" && args.includes("--check")) {
    return normalizeDiffCheckResult(result);
  }
  return result;
}

function detail(result) {
  return [result.error?.message, result.stderr, result.stdout]
    .filter(Boolean)
    .join("\n")
    .trim() || "git failed without diagnostic output";
}

export function verifyRepositoryHygiene(root, runGit = git) {
  const head = runGit(root, ["rev-parse", "--verify", "HEAD"]);
  if (head.error || head.status !== 0) {
    return {
      status: 2,
      messages: [
        `Repository hygiene could not resolve HEAD: ${detail(head)}`,
      ],
    };
  }

  const whitespace = runGit(root, ["diff", "--check", "HEAD", "--"]);
  if (
    whitespace.error ||
    whitespace.status === null ||
    (whitespace.status !== 0 && whitespace.status !== 1)
  ) {
    return {
      status: 2,
      messages: [
        `Repository hygiene could not evaluate git diff --check: ${detail(whitespace)}`,
      ],
    };
  }

  const status = runGit(root, [
    "status",
    "--porcelain",
    "--untracked-files=all",
  ]);
  if (status.error || status.status !== 0) {
    return {
      status: 2,
      messages: [
        `Repository hygiene could not inspect the working tree: ${detail(status)}`,
      ],
    };
  }

  const messages = [];
  if (whitespace.status === 1) {
    messages.push(
      "git diff --check reported whitespace errors or conflict markers.",
    );
    const detail = `${whitespace.stdout}${whitespace.stderr}`.trim();
    if (detail) messages.push(detail);
  }
  const dirty = status.stdout.trim();
  if (dirty) {
    messages.push(
      "The working tree is not clean after this job. Offending paths:",
      dirty,
    );
  }
  return { status: messages.length > 0 ? 1 : 0, messages };
}

async function main() {
  const root = parseRoot(process.argv.slice(2));
  const result = verifyRepositoryHygiene(root);
  for (const message of result.messages) {
    console.error(`::error::${message}`);
  }
  if (result.status === 0) {
    console.log("Repository hygiene verified: working tree is clean.");
  }
  process.exitCode = result.status;
}

const isDirect =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  main().catch((error) => {
    console.error(
      `::error::Repository hygiene could not be evaluated: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    process.exitCode = 2;
  });
}
