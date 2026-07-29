import { constants } from "node:fs";
import { access, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

function usageError(message) {
  throw new Error(
    `${message}\nUsage: node scripts/verify-test-harness-preconditions.mjs ` +
      "[--root PATH] (--file PATH | --binary NAME)+",
  );
}

export function parseArguments(args) {
  const files = [];
  const binaries = [];
  let root = process.cwd();

  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!value) usageError(`Missing value for ${flag ?? "argument"}.`);
    if (flag === "--root") {
      root = path.resolve(value);
    } else if (flag === "--file") {
      files.push(value);
    } else if (flag === "--binary") {
      binaries.push(value);
    } else {
      usageError(`Unknown argument ${JSON.stringify(flag)}.`);
    }
  }

  if (files.length === 0 && binaries.length === 0) {
    usageError("At least one --file or --binary check is required.");
  }
  return { root, files, binaries };
}

async function isAccessibleFile(target, mode) {
  try {
    const metadata = await stat(target);
    if (!metadata.isFile()) return false;
    await access(target, mode);
    return true;
  } catch {
    return false;
  }
}

export async function verifyPreconditions({ root, files, binaries }) {
  const failures = [];
  for (const file of files) {
    if (
      !(await isAccessibleFile(path.resolve(root, file), constants.R_OK))
    ) {
      failures.push(`Required test harness file is missing or unreadable: ${file}`);
    }
  }
  for (const binary of binaries) {
    const target = path.resolve(root, "node_modules", ".bin", binary);
    if (!(await isAccessibleFile(target, constants.X_OK))) {
      failures.push(
        `Required local binary is missing or not executable after npm ci: node_modules/.bin/${binary}`,
      );
    }
  }
  return failures;
}

async function main() {
  const input = parseArguments(process.argv.slice(2));
  const failures = await verifyPreconditions(input);
  for (const failure of failures) {
    console.error(`::error::${failure}`);
  }
  if (failures.length > 0) process.exitCode = 1;
  else console.log("Test harness files and local binaries are present.");
}

const isDirect =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  main().catch((error) => {
    console.error(
      `::error::Could not evaluate test harness preconditions: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    process.exitCode = 2;
  });
}
