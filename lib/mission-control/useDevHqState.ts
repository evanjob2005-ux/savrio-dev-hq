"use client";

// Polls the Dev HQ state API for Mission Control.
//
// The last good snapshot is kept when a poll fails so the founder keeps seeing
// the most recent known state instead of an empty dashboard, with the staleness
// surfaced separately rather than silently.

import { useCallback, useEffect, useRef, useState } from "react";
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

async function fetchState(signal: AbortSignal): Promise<DevHqState> {
  const response = await fetch("/api/dev-hq/state", { cache: "no-store", signal });
  if (!response.ok) {
    throw new Error(`Dev HQ state request failed (HTTP ${response.status}).`);
  }
  return (await response.json()) as DevHqState;
}

export function useDevHqState(): DevHqStateFeed {
  const [state, setState] = useState<DevHqState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Exposes the effect-local poll to callers without lifting the fetch out of
  // the effect that owns its abort controller and interval.
  const pollRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const poll = async () => {
      try {
        const next = await fetchState(controller.signal);
        if (!active) return;
        setState(next);
        setUpdatedAt(new Date().toISOString());
        setError(null);
        setConsecutiveFailures(0);
        setHasLoaded(true);
      } catch (err) {
        if (!active || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load Dev HQ state.");
        setConsecutiveFailures((count) => count + 1);
        setHasLoaded(true);
      }
    };

    pollRef.current = poll;
    void poll();
    const timer = setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      pollRef.current = null;
      clearInterval(timer);
      controller.abort();
    };
  }, []);

  const refresh = useCallback(async () => {
    await pollRef.current?.();
  }, []);

  const applySnapshot = useCallback((next: DevHqState) => {
    setState(next);
    setUpdatedAt(new Date().toISOString());
    setError(null);
  }, []);

  let status: FeedStatus = "live";
  if (!hasLoaded && !state) {
    status = "initial";
  } else if (consecutiveFailures >= DISCONNECTED_AFTER_FAILURES) {
    status = "disconnected";
  } else if (consecutiveFailures > 0) {
    status = "degraded";
  }

  return {
    state,
    status,
    error,
    updatedAt,
    consecutiveFailures,
    refresh,
    applySnapshot,
  };
}
