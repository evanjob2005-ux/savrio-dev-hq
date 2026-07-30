import http from "node:http";

const host = "127.0.0.1";
const port = Number(process.env.E2E_TRIGGER_PORT ?? 3199);
const triggerSecret = "test-trigger-token";
const authorization = `Bearer ${triggerSecret}`;
const allowedTasks = new Set([
  "founder-request-workflow",
  "founder-request-continuation",
]);
const calls = [];
const idempotentRuns = new Map();
let sequence = 0;

function send(response, status, body) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json",
  });
  response.end(JSON.stringify(body));
}

function exactKeys(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function nonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function validTaskPayload(taskId, payload) {
  if (taskId === "founder-request-workflow") {
    return (
      exactKeys(payload, ["executionId", "projectId", "taskId"]) &&
      nonEmptyString(payload.executionId) &&
      nonEmptyString(payload.projectId) &&
      nonEmptyString(payload.taskId)
    );
  }

  return (
    exactKeys(payload, ["approvalId", "decision", "executionId"]) &&
    nonEmptyString(payload.executionId) &&
    nonEmptyString(payload.approvalId) &&
    (payload.decision === "approved" || payload.decision === "rejected")
  );
}

function decodeTaskId(url) {
  const match = url?.match(/^\/api\/v1\/tasks\/([^/]+)\/trigger$/);
  if (!match) return null;
  try {
    const taskId = decodeURIComponent(match[1]);
    return allowedTasks.has(taskId) ? taskId : null;
  } catch {
    return null;
  }
}

const server = http.createServer((request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    send(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && request.url === "/__e2e/calls") {
    if (request.headers.authorization !== authorization) {
      send(response, 401, { error: "Unauthorized." });
      return;
    }
    send(response, 200, { calls });
    return;
  }

  const taskId = decodeTaskId(request.url);
  if (request.method !== "POST" || !taskId) {
    send(response, 404, { error: "Not found." });
    return;
  }

  if (request.headers.authorization !== authorization) {
    send(response, 401, { error: "Unauthorized." });
    return;
  }

  const chunks = [];
  let byteLength = 0;
  let tooLarge = false;
  request.on("data", (chunk) => {
    byteLength += chunk.length;
    if (byteLength > 64 * 1024) {
      tooLarge = true;
      return;
    }
    chunks.push(chunk);
  });
  request.on("end", () => {
    if (tooLarge) {
      send(response, 413, { error: "Trigger payload is too large." });
      return;
    }

    try {
      const body = Buffer.concat(chunks).toString("utf8");
      const parsed = JSON.parse(body);
      if (
        !exactKeys(parsed, ["options", "payload"]) ||
        typeof parsed.payload !== "string" ||
        parsed.options?.payloadType !== "application/super+json" ||
        !Number.isInteger(parsed.options?.payloadSize) ||
        parsed.options.payloadSize !== Buffer.byteLength(parsed.payload)
      ) {
        send(response, 400, { error: "Invalid Trigger payload." });
        return;
      }

      const packet = JSON.parse(parsed.payload);
      if (!exactKeys(packet, ["json"]) || !validTaskPayload(taskId, packet.json)) {
        send(response, 400, { error: "Invalid Trigger payload data." });
        return;
      }

      const payload = packet.json;
      const idempotencyKey = parsed.options.idempotencyKey ?? null;
      const idempotencyKeySource =
        parsed.options.idempotencyKeyOptions?.key ?? null;
      const idempotencyKeyScope =
        parsed.options.idempotencyKeyOptions?.scope ?? null;

      if (
        taskId === "founder-request-continuation" &&
        (!/^[a-f0-9]{64}$/.test(idempotencyKey ?? "") ||
          idempotencyKeySource !==
            `founder-continuation-${payload.executionId}` ||
          idempotencyKeyScope !== "run" ||
          !calls.some(
            (call) =>
              call.taskId === "founder-request-workflow" &&
              call.executionId === payload.executionId,
          ))
      ) {
        send(response, 400, {
          error: "Invalid continuation dispatch identity.",
        });
        return;
      }

      const prior = idempotencyKey
        ? idempotentRuns.get(`${taskId}:${idempotencyKey}`)
        : null;
      if (prior) {
        send(response, 200, { id: prior, isCached: true });
        return;
      }

      sequence += 1;
      const id = `run-e2e-${taskId}-${sequence}`;
      calls.push({
        taskId,
        executionId: payload.executionId,
        idempotencyKey,
        idempotencyKeySource,
        idempotencyKeyScope,
        id,
      });
      if (idempotencyKey) {
        idempotentRuns.set(`${taskId}:${idempotencyKey}`, id);
      }
      send(response, 200, { id });
    } catch {
      send(response, 400, { error: "Invalid JSON." });
    }
  });
});

server.listen(port, host);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
