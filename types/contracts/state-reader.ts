import type { DevHqState } from "@/lib/dev-hq/types";

/**
 * Read model for the aggregate Mission Control snapshot.
 *
 * DevHqState currently lives in lib/dev-hq because its overview block is typed
 * by the Mission Control placeholder module. The import direction is inverted
 * relative to the other contracts; it is type-only, so nothing is pulled in at
 * runtime. Moving DevHqState into types/domain is deferred so this sprint does
 * not touch Mission Control.
 */
export interface StateReader {
  getState(): Promise<DevHqState>;
}
