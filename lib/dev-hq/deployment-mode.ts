export type DevHqDeploymentMode = "local" | "disabled";

/**
 * Explicit capability switch for the Dev HQ HTTP surface.
 *
 * Unset, misspelled, and public-host values all fail closed. `local` is an
 * operator assertion that this process is bound to a trusted local
 * environment; it is intentionally independent of whether Next.js is running
 * an optimized build.
 */
export function getDevHqDeploymentMode(): DevHqDeploymentMode {
  return process.env.DEV_HQ_DEPLOYMENT_MODE === "local" ? "local" : "disabled";
}
