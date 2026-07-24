// Typed mock data for the Phase 2 simulation. No database — these seed the
// engine's in-memory React state. Timestamps are fixed ISO strings so server
// and client render identically (no hydration mismatch).

import type { Task, ValidationCheck } from "@/types/workflow";

function validation(): ValidationCheck[] {
  return [
    { id: "lint", command: "npm.cmd run lint", label: "Lint", status: "pending" },
    { id: "build", command: "npm.cmd run build", label: "Build", status: "pending" },
    {
      id: "tests",
      command: "npm.cmd run test",
      label: "Tests",
      status: "pending",
      optional: true,
    },
  ];
}

export const MOCK_TASKS: Task[] = [
  // 1) Waiting to start — READY.
  {
    id: "SAV-241",
    title: "Adaptive Cookbook — allergen swap suggestions",
    objective:
      "When a recipe contains a flagged allergen, surface one-tap ingredient swaps that preserve macros and cuisine style.",
    repository: "savrio-dev-hq",
    branch: "feature/allergen-swaps",
    priority: "High",
    status: "READY",
    currentStage: "READY",
    currentAgent: "ChatGPT",
    progress: 10,
    createdAt: "2026-07-23T14:02:00.000Z",
    startedAt: null,
    completedAt: null,
    acceptanceCriteria: [
      "Detects allergens already modeled on the recipe record.",
      "Suggests at least two swaps per flagged allergen.",
      "Swaps stay within ±5% of the original macro estimate.",
      "Works on mobile and desktop with keyboard navigation.",
    ],
    expectedFiles: [
      "components/cookbook/AllergenSwapPanel.tsx",
      "lib/cookbook/swaps.ts",
      "app/recipe/[id]/page.tsx",
    ],
    protectedFiles: [
      "lib/billing/credits.ts",
      "lib/auth/session.ts",
      "supabase/migrations/*",
    ],
    requiredValidation: validation(),
    approvalsRequired: ["Evan — final product approval"],
    activity: [
      {
        id: "SAV-241-a1",
        timestamp: "2026-07-23T14:02:00.000Z",
        actor: "ChatGPT",
        message: "Execution plan and acceptance criteria defined. Task ready to start.",
        kind: "system",
      },
    ],
    stageHistory: [
      {
        stage: "PLANNING",
        agent: "ChatGPT",
        enteredAt: "2026-07-23T13:55:00.000Z",
        status: "complete",
      },
      {
        stage: "READY",
        agent: "ChatGPT",
        enteredAt: "2026-07-23T14:02:00.000Z",
        status: "active",
      },
    ],
    blockers: [],
    knownRisks: [
      "Swap catalog is mock data; real nutrition sourcing is out of scope for this phase.",
    ],
    retryCount: 0,
  },

  // 2) Currently in progress — mid-pipeline at CODEX_REVIEW (not auto-running
  //    on load; the user can resume the simulation from here).
  {
    id: "SAV-238",
    title: "Savrio AI — weekly credit counter accuracy",
    objective:
      "Fix the visible remaining-credit counter so AI and Scanner usage decrement the shared weekly allowance in real time.",
    repository: "savrio-dev-hq",
    branch: "feature/credit-counter",
    priority: "Critical",
    status: "CODEX_REVIEW",
    currentStage: "CODEX_REVIEW",
    currentAgent: "Codex",
    progress: 55,
    createdAt: "2026-07-23T11:20:00.000Z",
    startedAt: "2026-07-23T11:45:00.000Z",
    completedAt: null,
    acceptanceCriteria: [
      "Counter reflects the shared 10-credit weekly allowance for free users.",
      "AI generation and Scanner both decrement the same pool.",
      "Pro users show unlimited and never decrement.",
      "Counter updates without a full page reload.",
    ],
    expectedFiles: [
      "components/credits/CreditCounter.tsx",
      "lib/credits/useCredits.ts",
    ],
    protectedFiles: ["lib/billing/credits.ts", "supabase/migrations/*"],
    requiredValidation: [
      { id: "lint", command: "npm.cmd run lint", label: "Lint", status: "running" },
      { id: "build", command: "npm.cmd run build", label: "Build", status: "pending" },
      {
        id: "tests",
        command: "npm.cmd run test",
        label: "Tests",
        status: "pending",
        optional: true,
      },
    ],
    approvalsRequired: ["Evan — final product approval"],
    activity: [
      {
        id: "SAV-238-a4",
        timestamp: "2026-07-23T12:05:00.000Z",
        actor: "Codex",
        message: "Codex began focused review.",
        kind: "build",
      },
      {
        id: "SAV-238-a3",
        timestamp: "2026-07-23T12:03:00.000Z",
        actor: "Supervisor",
        message: "Supervisor confirmed scope.",
        kind: "gate",
      },
      {
        id: "SAV-238-a2",
        timestamp: "2026-07-23T11:58:00.000Z",
        actor: "Claude",
        message: "Claude completed implementation.",
        kind: "build",
      },
      {
        id: "SAV-238-a1",
        timestamp: "2026-07-23T11:45:00.000Z",
        actor: "Evan",
        message: "Task started (simulated).",
        kind: "system",
      },
    ],
    stageHistory: [
      { stage: "PLANNING", agent: "ChatGPT", enteredAt: "2026-07-23T11:20:00.000Z", status: "complete" },
      { stage: "READY", agent: "ChatGPT", enteredAt: "2026-07-23T11:40:00.000Z", status: "complete" },
      { stage: "CLAUDE_BUILD", agent: "Claude", enteredAt: "2026-07-23T11:45:00.000Z", status: "complete" },
      { stage: "SUPERVISOR_SCOPE_CHECK", agent: "Supervisor", enteredAt: "2026-07-23T12:00:00.000Z", status: "complete" },
      { stage: "CODEX_REVIEW", agent: "Codex", enteredAt: "2026-07-23T12:05:00.000Z", status: "active" },
    ],
    blockers: [],
    knownRisks: [
      "Credit accounting is a high-risk area; real logic is out of scope for this mock.",
    ],
    retryCount: 0,
  },

  // 3) Waiting for Evan's approval — WAITING_FOR_EVAN, validation passed.
  {
    id: "SAV-230",
    title: "Make This at Home — camera capture flow",
    objective:
      "Let a signed-in user photograph a dish and receive a generated Savrio recipe recreation with a macro estimate.",
    repository: "savrio-dev-hq",
    branch: "feature/make-at-home-capture",
    priority: "High",
    status: "WAITING_FOR_EVAN",
    currentStage: "WAITING_FOR_EVAN",
    currentAgent: "Evan",
    progress: 97,
    createdAt: "2026-07-22T16:10:00.000Z",
    startedAt: "2026-07-22T16:30:00.000Z",
    completedAt: null,
    acceptanceCriteria: [
      "Capture works on mobile Safari and Chrome.",
      "Graceful empty and error states when no dish is detected.",
      "Result screen shows the recipe and macro estimate together.",
      "Respects the weekly Scanner credit allowance.",
    ],
    expectedFiles: [
      "components/capture/CameraCapture.tsx",
      "app/make-at-home/page.tsx",
      "lib/capture/pipeline.ts",
    ],
    protectedFiles: ["lib/billing/credits.ts", "lib/auth/session.ts"],
    requiredValidation: [
      { id: "lint", command: "npm.cmd run lint", label: "Lint", status: "passed" },
      { id: "build", command: "npm.cmd run build", label: "Build", status: "passed" },
      {
        id: "tests",
        command: "npm.cmd run test",
        label: "Tests",
        status: "passed",
        optional: true,
      },
    ],
    approvalsRequired: ["Evan — final product approval"],
    activity: [
      { id: "SAV-230-a6", timestamp: "2026-07-22T17:12:00.000Z", actor: "Supervisor", message: "Supervisor marked task ready for Evan.", kind: "approval" },
      { id: "SAV-230-a5", timestamp: "2026-07-22T17:08:00.000Z", actor: "Gemini", message: "Gemini completed QA. No blocking issues.", kind: "qa" },
      { id: "SAV-230-a4", timestamp: "2026-07-22T17:00:00.000Z", actor: "Claude", message: "Claude completed final engineering review.", kind: "build" },
      { id: "SAV-230-a3", timestamp: "2026-07-22T16:52:00.000Z", actor: "Supervisor", message: "Supervisor confirmed validation.", kind: "gate" },
      { id: "SAV-230-a2", timestamp: "2026-07-22T16:44:00.000Z", actor: "Codex", message: "Codex completed corrections.", kind: "build" },
      { id: "SAV-230-a1", timestamp: "2026-07-22T16:30:00.000Z", actor: "Claude", message: "Claude completed implementation.", kind: "build" },
    ],
    stageHistory: [
      { stage: "CLAUDE_BUILD", agent: "Claude", enteredAt: "2026-07-22T16:30:00.000Z", status: "complete" },
      { stage: "SUPERVISOR_SCOPE_CHECK", agent: "Supervisor", enteredAt: "2026-07-22T16:40:00.000Z", status: "complete" },
      { stage: "CODEX_REVIEW", agent: "Codex", enteredAt: "2026-07-22T16:44:00.000Z", status: "complete" },
      { stage: "SUPERVISOR_VALIDATION_CHECK", agent: "Supervisor", enteredAt: "2026-07-22T16:52:00.000Z", status: "complete" },
      { stage: "CLAUDE_FINAL_REVIEW", agent: "Claude", enteredAt: "2026-07-22T17:00:00.000Z", status: "complete" },
      { stage: "GEMINI_QA", agent: "Gemini", enteredAt: "2026-07-22T17:04:00.000Z", status: "complete" },
      { stage: "SUPERVISOR_FINAL_REVIEW", agent: "Supervisor", enteredAt: "2026-07-22T17:10:00.000Z", status: "complete" },
      { stage: "WAITING_FOR_EVAN", agent: "Evan", enteredAt: "2026-07-22T17:12:00.000Z", status: "active" },
    ],
    blockers: [],
    knownRisks: [
      "On-device capture quality varies; low-light handling flagged by QA as a follow-up.",
    ],
    retryCount: 1,
  },
];
