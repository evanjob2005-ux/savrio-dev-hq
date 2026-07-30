import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApprovalQueuePanel } from "@/components/mission-control/ApprovalQueuePanel";
import type { ApprovalItem } from "@/lib/mission-control/view-model";

/**
 * Approve and Reject are the only irreversible controls the Founder operates,
 * and until now they were the least verified lines in the product.
 *
 * The single test that rendered this panel used `renderToStaticMarkup`, whose
 * output carries no handler information whatsoever. `onApprove` and `onReject`
 * could be swapped and the markup would be byte-identical: the Founder presses
 * Approve, the request is rejected, and nothing in the repository notices.
 *
 * The last test in this file is the negative control for the other three. It
 * asserts that the old approach genuinely cannot distinguish a correct panel
 * from a swapped one -- without it, these tests would look like a redundant
 * second opinion on markup rather than the thing that actually closes the gap.
 */

const approvalItem = (overrides: Partial<ApprovalItem["approval"]> = {}) => {
  const item: ApprovalItem = {
    approval: {
      id: "apr-1",
      taskId: "tsk-1",
      executionId: "exe-1",
      title: "Ship the onboarding revision",
      summary: "Validation passed; awaiting the Founder decision.",
      status: "pending",
      requestedByAgentId: "agent-executive-orchestrator",
      decidedByUserId: null,
      requestedAt: "2026-07-29T09:00:00.000Z",
      decidedAt: null,
      decision: null,
      continuation: "not_attempted",
      ...overrides,
    },
    task: null,
    project: null,
    run: {
      executionId: "exe-1",
      stage: "founder_approval_required",
    } as ApprovalItem["run"],
    actionable: true,
  };
  return item;
};

describe("ApprovalQueuePanel decision wiring", () => {
  it("routes the Approve button to onApprove and nowhere else", () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();

    render(
      <ApprovalQueuePanel
        approvals={[approvalItem()]}
        onApprove={onApprove}
        onReject={onReject}
        busyApprovalId={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(onApprove).toHaveBeenCalledExactlyOnceWith("apr-1");
    // The assertion that a swap would break. Counting calls to onApprove alone
    // would still pass if both buttons were wired to it.
    expect(onReject).not.toHaveBeenCalled();
  });

  it("routes the Reject button to onReject and nowhere else", () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();

    render(
      <ApprovalQueuePanel
        approvals={[approvalItem()]}
        onApprove={onApprove}
        onReject={onReject}
        busyApprovalId={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    expect(onReject).toHaveBeenCalledExactlyOnceWith("apr-1");
    expect(onApprove).not.toHaveBeenCalled();
  });

  it("keeps the retry labels bound to the decision they retry", () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();

    // Once a decision is recorded, only the matching retry button is offered.
    // A swap here re-runs the opposite decision under a label promising the
    // original -- the same defect, in the path taken after something failed.
    render(
      <ApprovalQueuePanel
        approvals={[approvalItem({ decision: "approved" })]}
        onApprove={onApprove}
        onReject={onReject}
        busyApprovalId={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry approval" }));

    expect(onApprove).toHaveBeenCalledExactlyOnceWith("apr-1");
    expect(onReject).not.toHaveBeenCalled();
  });

  it("does not press a disabled button while a decision is in flight", () => {
    const onApprove = vi.fn();

    render(
      <ApprovalQueuePanel
        approvals={[approvalItem()]}
        onApprove={onApprove}
        onReject={vi.fn()}
        busyApprovalId="apr-1"
      />,
    );

    const button = screen.getByRole("button", { name: "Working…" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");

    fireEvent.click(button);
    expect(onApprove).not.toHaveBeenCalled();
  });

  it("NULL ARM: static markup cannot tell a correct panel from a swapped one", () => {
    const correct = renderToStaticMarkup(
      <ApprovalQueuePanel
        approvals={[approvalItem()]}
        onApprove={() => {}}
        onReject={() => {}}
        busyApprovalId={null}
      />,
    );

    // The identical panel with the two handlers exchanged -- the exact defect
    // UI-01 describes.
    const onApprove = vi.fn();
    const onReject = vi.fn();
    const swapped = renderToStaticMarkup(
      <ApprovalQueuePanel
        approvals={[approvalItem()]}
        onApprove={onReject}
        onReject={onApprove}
        busyApprovalId={null}
      />,
    );

    // Byte-identical. This is why the tests above render into a DOM and press
    // the buttons instead of comparing strings.
    expect(swapped).toBe(correct);
  });
});
