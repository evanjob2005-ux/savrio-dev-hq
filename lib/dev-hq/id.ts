import { randomUUID } from "node:crypto";

let sequence = 0;

export function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

/**
 * Mints an unguessable capability token.
 *
 * Deliberately NOT nextId(). That returns `prefix-<epoch-ms>-<counter>` from a
 * process-wide counter, which is fine for entity ids and useless for a secret:
 * an independent reviewer brute-forced a live review callback token in ~250k
 * guesses, and narrowed it much further because /api/dev-hq/events is
 * unauthenticated in development and discloses both the clock and the shared
 * counter immediately either side of a dispatch.
 *
 * A callback token is the sole proof that a caller is the authorized reviewer
 * for a specific review iteration, so it must be drawn from a CSPRNG.
 */
export function nextCapabilityToken(prefix: string): string {
  return `${prefix}-${randomUUID().replace(/-/g, "")}`;
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function nowIso(): string {
  return new Date().toISOString();
}
