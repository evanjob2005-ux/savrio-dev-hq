import {
  expect,
  test,
  type APIRequestContext,
  type Page,
  type TestInfo,
} from "@playwright/test";

const internalHeaders = {
  "x-dev-hq-internal-token": "test-internal-token",
};
const triggerStubURL = `http://127.0.0.1:${Number(process.env.E2E_TRIGGER_PORT ?? 3199)}`;
const triggerSecret = "test-trigger-token";
const triggerHeaders = {
  authorization: `Bearer ${triggerSecret}`,
};

function monitorPage(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(
        `${response.status()} ${new URL(response.url()).pathname}`,
      );
    }
  });
  return () => {
    expect(pageErrors, `uncaught page errors:\n${pageErrors.join("\n")}`).toEqual(
      [],
    );
    expect(
      consoleErrors,
      `console errors:\n${consoleErrors.join("\n")}`,
    ).toEqual([]);
    expect(
      failedResponses,
      `HTTP failures:\n${failedResponses.join("\n")}`,
    ).toEqual([]);
  };
}

async function createFounderRequest(
  request: APIRequestContext,
  title: string,
) {
  const response = await request.post("/api/dev-hq/founder-requests", {
    data: {
      title,
      description: `Live Mission Control evidence for ${title}.`,
      priority: "High",
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as {
    execution: { id: string };
  };
}

async function triggerCalls(request: APIRequestContext) {
  const response = await request.get(`${triggerStubURL}/__e2e/calls`, {
    headers: triggerHeaders,
  });
  expect(response.status()).toBe(200);
  return (await response.json()) as {
    calls: Array<{
      taskId: string;
      executionId: string;
      idempotencyKey: string | null;
      idempotencyKeySource: string | null;
      idempotencyKeyScope: string | null;
      id: string;
    }>;
  };
}

function uniqueTitle(kind: string, testInfo: TestInfo) {
  return `E2E ${kind} ${testInfo.project.name} ${testInfo.workerIndex}`;
}

test("dispatches the live founder approval continuation", async ({
  page,
  request,
}, testInfo) => {
  const assertNoPageFailures = monitorPage(page);
  const title = uniqueTitle("approval", testInfo);
  const approvalTitle = `Founder approval - ${title}`;
  const created = await createFounderRequest(request, title);

  const review = await request.post("/api/dev-hq/internal/executive-review", {
    headers: internalHeaders,
    data: { executionId: created.execution.id },
  });
  expect(review.status()).toBe(200);
  const { approvalId } = (await review.json()) as { approvalId: string };
  expect(approvalId).toBeTruthy();

  const gate = await request.post("/api/dev-hq/internal/approval-gate", {
    headers: internalHeaders,
    data: { executionId: created.execution.id, approvalId },
  });
  expect(gate.status()).toBe(200);

  await page.goto("/");
  const item = page
    .locator('[aria-label="Founder approval gates"] > *')
    .getByRole("listitem")
    .filter({
      has: page.getByRole("heading", {
        name: approvalTitle,
        exact: true,
      }),
    });
  await expect(item).toHaveCount(1);
  await expect(
    item.getByRole("heading", { name: approvalTitle, exact: true }),
  ).toBeVisible();

  const approve = item.getByRole("button", {
    name: "Approve",
    exact: true,
  });
  await expect(approve).toBeEnabled();
  await approve.click();

  await expect(
    item.getByText("Continuation started", { exact: true }),
  ).toBeVisible();
  await expect(approve).toHaveCount(0);

  const { calls } = await triggerCalls(request);
  expect(
    calls.filter(
      (call) =>
        call.taskId === "founder-request-workflow" &&
        call.executionId === created.execution.id,
    ),
  ).toHaveLength(1);
  expect(
    calls.filter(
      (call) =>
        call.taskId === "founder-request-continuation" &&
        call.executionId === created.execution.id &&
        call.idempotencyKeySource ===
          `founder-continuation-${created.execution.id}` &&
        call.idempotencyKeyScope === "run" &&
        /^[a-f0-9]{64}$/.test(call.idempotencyKey ?? ""),
    ),
  ).toHaveLength(1);
  assertNoPageFailures();
});

test("shows the process-start blocked task in the blocked lane", async ({
  page,
}) => {
  const assertNoPageFailures = monitorPage(page);
  await page.goto("/");
  const bucket = page.locator('section[aria-label="Blocked tasks"]');
  await expect(
    bucket.getByText("E2E blocked task", { exact: true }),
  ).toBeVisible();
  assertNoPageFailures();
});

test("the Trigger transport rejects wrong auth, targets, and payloads", async ({
  request,
}) => {
  const wrongAuth = await request.get(`${triggerStubURL}/__e2e/calls`);
  expect(wrongAuth.status()).toBe(401);

  const wrongTriggerAuth = await request.post(
    `${triggerStubURL}/api/v1/tasks/founder-request-workflow/trigger`,
    {
      data: {
        payload: JSON.stringify({
          json: {
            executionId: "exec-wrong",
            taskId: "task-wrong",
            projectId: "proj-wrong",
          },
        }),
        options: {
          payloadType: "application/super+json",
          payloadSize: 100,
        },
      },
    },
  );
  expect(wrongTriggerAuth.status()).toBe(401);

  const wrongTarget = await request.post(
    `${triggerStubURL}/api/v1/tasks/not-an-hq-task/trigger`,
    {
      headers: triggerHeaders,
      data: {
        payload: JSON.stringify({ json: { executionId: "exec-wrong" } }),
        options: {
          payloadType: "application/super+json",
          payloadSize: 44,
        },
      },
    },
  );
  expect(wrongTarget.status()).toBe(404);

  const wrongPath = await request.post(
    `${triggerStubURL}/api/v1/tasks/founder-request-workflow/trigger/extra`,
    { headers: triggerHeaders, data: {} },
  );
  expect(wrongPath.status()).toBe(404);

  const malformed = await request.post(
    `${triggerStubURL}/api/v1/tasks/founder-request-workflow/trigger`,
    {
      headers: triggerHeaders,
      data: {
        payload: JSON.stringify({ json: { executionId: "exec-wrong" } }),
        options: {
          payloadType: "application/super+json",
          payloadSize: 42,
        },
      },
    },
  );
  expect(malformed.status()).toBe(400);

  const wrongSizePayload = JSON.stringify({
    json: {
      executionId: "exec-wrong",
      taskId: "task-wrong",
      projectId: "proj-wrong",
    },
  });
  const wrongSize = await request.post(
    `${triggerStubURL}/api/v1/tasks/founder-request-workflow/trigger`,
    {
      headers: triggerHeaders,
      data: {
        payload: wrongSizePayload,
        options: {
          payloadType: "application/super+json",
          payloadSize: Buffer.byteLength(wrongSizePayload) + 1,
        },
      },
    },
  );
  expect(wrongSize.status()).toBe(400);
});
