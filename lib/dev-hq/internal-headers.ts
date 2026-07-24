import { DEV_HQ_INTERNAL_TOKEN_HEADER } from "@/lib/dev-hq/internal-guard";

/** Headers for server-to-server internal Dev HQ callbacks (Trigger worker -> Next.js). */
export function getDevHqInternalHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = process.env.DEV_HQ_INTERNAL_TOKEN;
  if (token) {
    headers[DEV_HQ_INTERNAL_TOKEN_HEADER] = token;
  }
  return headers;
}
