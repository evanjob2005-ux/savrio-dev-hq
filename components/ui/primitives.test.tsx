import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProgressBar } from "./primitives";

// Proving test for the DOM (jsdom) Vitest project. ProgressBar is a pure
// presentational primitive, so it exercises real rendering and the
// accessibility tree without pulling in application state.
describe("ProgressBar", () => {
  it("renders an accessible progressbar carrying the supplied value", () => {
    render(<ProgressBar value={42} label="Build progress" />);

    const bar = screen.getByRole("progressbar", { name: "Build progress" });

    expect(bar.getAttribute("aria-valuenow")).toBe("43");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.getAttribute("aria-valuetext")).toBe("42%");
  });

  it("paints the filled portion to the requested width", () => {
    render(<ProgressBar value={42} label="Build progress" />);

    const fill = screen.getByRole("progressbar", {
      name: "Build progress",
    }).firstElementChild;

    expect(fill).not.toBeNull();
    expect((fill as HTMLElement).style.width).toBe("42%");
  });

  it("clamps out-of-range values into 0-100 when rendering", () => {
    const { unmount } = render(<ProgressBar value={150} label="Over" />);

    const over = screen.getByRole("progressbar", { name: "Over" });
    expect(over.getAttribute("aria-valuenow")).toBe("100");
    expect((over.firstElementChild as HTMLElement).style.width).toBe("100%");

    unmount();

    render(<ProgressBar value={-25} label="Under" />);

    const under = screen.getByRole("progressbar", { name: "Under" });
    expect(under.getAttribute("aria-valuenow")).toBe("0");
    expect((under.firstElementChild as HTMLElement).style.width).toBe("0%");
  });
});
