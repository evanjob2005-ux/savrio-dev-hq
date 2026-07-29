"use client";

// Polls the Dev HQ state API for Mission Control.
//
// The last good snapshot is kept when a poll fails so the founder keeps seeing
// the most recent known state instead of an empty dashboard, with the staleness
// surfaced separately rather than silently.
//
// Two properties are enforced here rather than left to the callers:
//
// UI-06 — one loop, one snapshot. The feed lives in this module, not in each
// hook instance. `useDevHqState()` is called from two sibling components
// (MissionControlOverview and DispatchAgentPanel), and a per-instance effect
// gave each of them its own 3s interval: twice the request rate, and — worse —
// two snapshots that could disagree, so the top of the page could show an
// approval the bottom of the page had already seen decided. Consumers subscribe
// to the single store via `useSyncExternalStore`, so N consumers still produce
// one request per interval and all read the same object.
//
// UI-07 — a stale response can never overwrite a fresher one. Every request
// takes a sequence number before it leaves, and a response is applied only if
// no higher-numbered write has landed in the meantime. A decision posted by the
// founder returns a fresh snapshot through `applySnapshot`, which takes the next
// sequence number and therefore supersedes every poll already in flight.
// Without this, the poll that started before the approval could resolve after it
// and put the approval back into the queue as pending.

import { useCallback, useSyncExternalStore } from "react";
import type { DevHqState } from "@/lib/dev-hq/types";

const POLL_INTERVAL_MS = 3000;

/** Consecutive failures before the feed is reported as disconnected. */
const DISCONNECTED_AFTER_FAILURES = 3;

export type FeedStatus = "initial" | "live" | "degraded" | "disconnected";

export interface DevHqStateFeed {
  state: DevHqState | null;
  status: FeedStatus;
  error: string | null;
  /** ISO timestamp of the last successful snapshot. */
  updatedAt: string | null;
  consecutiveFailures: number;
  /** Polls immediately, outside the regular interval. */
  refresh: () => Promise<void>;
  /** Replaces the snapshot with one returned by a mutating request. */
  applySnapshot: (next: DevHqState) => void;
}

/** The part of the feed the store owns. The two functions are added per hook. */
type FeedSnapshot = Omit<DevHqStateFeed, "refresh" | "applySnapshot">;

async function fetchState(signal: AbortSignal): Promise<DevHqState> {
  const response = await fetch("/api/dev-hq/state", { cache: "no-store", signal });
  if (!response.ok) {
    throw new Error(`Dev HQ state request failed (HTTP ${response.status}).`);
  }
  return (await response.json()) as DevHqState;
}

const INITIAL_SNAPSHOT: FeedSnapshot = {
  state: null,
  status: "initial",
  error: null,
  updatedAt: null,
  consecutiveFailures: 0,
};

// ---- The single shared feed -------------------------------------------------
//
// Module scope, so it is one instance per browser tab regardless of how many
// components read it or where they sit in the tree. Everything below is reset by
// `stop()` when the last consumer unsubscribes.

let snapshot: FeedSnapshot = INITIAL_SNAPSHOT;
let hasLoaded = false;
const listeners = new Set<() => void>();

let controller: AbortController | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

/**
 * Monotonic write ordering (UI-07).
 *
 * `nextSequence` is handed out — pre-incremented — to every request before it is
 * sent. `appliedSequence` is the highest one whose result reached the snapshot.
 * A result is discarded when its own number is not greater, which is exactly the
 * case "something newer than me has already been applied".
 *
 * This is ordering by *write*, not by arrival: it also keeps the newer of two
 * polls that resolve out of order, which a simple "ignore all but the latest
 * request" guard would not.
 */
let nextSequence = 0;
let appliedSequence = 0;

function statusFor(consecutiveFailures: number, state: DevHqState | null): FeedStatus {
  if (!hasLoaded && !state) return "initial";
  if (consecutiveFailures >= DISCONNECTED_AFTER_FAILURES) return "disconnected";
  if (consecutiveFailures > 0) return "degraded";
  return "live";
}

function emit(next: FeedSnapshot): void {
  snapshot = next;
  // Copied first: a listener that unsubscribes during notification must not
  // shorten the set being iterated.
  for (const listener of [...listeners]) listener();
}

async function poll(): Promise<void> {
  // Captured rather than read again later: after a teardown, `controller` is a
  // different object (or null) and this request's own signal is the only thing
  // that still says whether *it* was cancelled.
  const signal = controller?.signal;
  if (!signal) return;

  const sequence = ++nextSequence;

  try {
    const next = await fetchState(signal);
    if (signal.aborted) return;
    // A fresher write — another poll, or the founder's own decision — landed
    // while this request was in flight. Dropping it is the whole point of UI-07.
    if (sequence <= appliedSequence) return;
    appliedSequence = sequence;
    hasLoaded = true;
    emit({
      state: next,
      status: statusFor(0, next),
      error: null,
      updatedAt: new Date().toISOString(),
      consecutiveFailures: 0,
    });
  } catch (err) {
    if (signal.aborted) return;
    hasLoaded = true;
    // Failure accounting is deliberately not sequence-gated. A request that
    // failed is evidence about the connection whether or not a newer snapshot
    // has since arrived, and it never overwrites `state`.
    const consecutiveFailures = snapshot.consecutiveFailures + 1;
    emit({
      ...snapshot,
      status: statusFor(consecutiveFailures, snapshot.state),
      error: err instanceof Error ? err.message : "Failed to load Dev HQ state.",
      consecutiveFailures,
    });
  }
}

function applyMutationSnapshot(next: DevHqState): void {
  // Taking the next sequence number is what supersedes the polls already in
  // flight: this snapshot came back from the write itself, so it is newer than
  // anything requested before it.
  appliedSequence = ++nextSequence;
  hasLoaded = true;
  emit({
    ...snapshot,
    state: next,
    status: statusFor(snapshot.consecutiveFailures, next),
    error: null,
    updatedAt: new Date().toISOString(),
  });
}

function start(): void {
  controller = new AbortController();
  void poll();
  timer = setInterval(() => {
    void poll();
  }, POLL_INTERVAL_MS);
}

function stop(): void {
  if (timer !== null) clearInterval(timer);
  timer = null;
  controller?.abort();
  controller = null;
  // Reset rather than retain: with no consumer left, the snapshot's age is
  // unbounded, and the next mount refetches immediately anyway. In-flight
  // requests from the previous lifetime are held off by their aborted signal,
  // not by the sequence numbers, which restart here.
  snapshot = INITIAL_SNAPSHOT;
  hasLoaded = false;
  nextSequence = 0;
  appliedSequence = 0;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
}

function getSnapshot(): FeedSnapshot {
  return snapshot;
}

function getServerSnapshot(): FeedSnapshot {
  // Server rendering has no feed. Returning the same frozen object keeps the
  // server markup and the first client render identical.
  return INITIAL_SNAPSHOT;
}

export function useDevHqState(): DevHqStateFeed {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const refresh = useCallback(async () => {
    await poll();
  }, []);

  const applySnapshot = useCallback((next: DevHqState) => {
    applyMutationSnapshot(next);
  }, []);

  return { ...current, refresh, applySnapshot };
}
