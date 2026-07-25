import type { StateReader } from "@/types/contracts";
import type { DevHqState } from "@/lib/dev-hq/types";
import { buildDevHqState } from "@/lib/dev-hq/store";

/**
 * Development-only StateReader. Delegates to buildDevHqState rather than
 * re-deriving the Mission Control snapshot, so the read model stays in one place.
 */
export class DevStateReader implements StateReader {
  async getState(): Promise<DevHqState> {
    return buildDevHqState();
  }
}

export function createDevStateReader(): DevStateReader {
  return new DevStateReader();
}
