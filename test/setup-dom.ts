import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Testing Library's auto-cleanup only registers itself when Vitest globals are
// enabled. Globals are off in this project, so unmount explicitly to keep the
// jsdom document clean between component tests.
afterEach(() => {
  cleanup();
});
