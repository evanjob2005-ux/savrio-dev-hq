export const DEFAULT_E2E_PORT = 3100;
export const DEFAULT_E2E_TRIGGER_PORT = 3199;

export interface E2EPorts {
  app: number;
  triggerStub: number;
}

export interface E2EPortEnvironment {
  E2E_PORT?: string;
  E2E_TRIGGER_PORT?: string;
}

function parsePort(
  name: "E2E_PORT" | "E2E_TRIGGER_PORT",
  raw: string | undefined,
  fallback: number,
): number {
  if (raw === undefined) return fallback;
  if (!/^[1-9]\d*$/.test(raw)) {
    throw new Error(
      `${name} must be a base-10 integer between 1 and 65535; received ${JSON.stringify(raw)}.`,
    );
  }

  const port = Number(raw);
  if (!Number.isSafeInteger(port) || port > 65_535) {
    throw new Error(
      `${name} must be a base-10 integer between 1 and 65535; received ${JSON.stringify(raw)}.`,
    );
  }
  return port;
}

export function resolveE2EPorts(
  env: E2EPortEnvironment,
): E2EPorts {
  const app = parsePort("E2E_PORT", env.E2E_PORT, DEFAULT_E2E_PORT);
  const triggerStub = parsePort(
    "E2E_TRIGGER_PORT",
    env.E2E_TRIGGER_PORT,
    DEFAULT_E2E_TRIGGER_PORT,
  );
  if (app === triggerStub) {
    throw new Error(
      `E2E_PORT and E2E_TRIGGER_PORT must be different; both resolved to ${app}.`,
    );
  }
  return { app, triggerStub };
}
