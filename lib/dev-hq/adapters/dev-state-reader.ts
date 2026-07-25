import type { StateReader } from "@/types/contracts";
import type { DevHqState } from "@/lib/dev-hq/types";
import { buildDevHqState } from "@/lib/dev-hq/store";

/**
 * Development-only StateReader. Delegates to the existing buildDevHqState so
 * the Mission Control JSON shape is preserved byte-for-byte.
 */
export class DevStateReader implements StateReader {
  async getState(): Promise<DevHqState> {
    return buildDevHqState();
  }
}

export function createDevStateReader(): DevStateReader {
  return new DevStateReader();
}
