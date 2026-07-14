import { describe, expect, it } from "vitest";
import {
  canCancelPaidTechProject,
  getTechProjectCancellationDeadline,
  TECH_PROJECT_CANCELLATION_WINDOW_HOURS,
} from "./tech-project-cancellation";

describe("tech project cancellation window", () => {
  const paidAt = new Date("2026-07-14T12:00:00.000Z");

  it("defines a 12-hour cancellation window", () => {
    expect(TECH_PROJECT_CANCELLATION_WINDOW_HOURS).toBe(12);
    expect(getTechProjectCancellationDeadline(paidAt).toISOString()).toBe(
      "2026-07-15T00:00:00.000Z",
    );
  });

  it("allows cancellation at the exact deadline", () => {
    expect(
      canCancelPaidTechProject(
        paidAt,
        new Date("2026-07-15T00:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("blocks cancellation after the deadline", () => {
    expect(
      canCancelPaidTechProject(
        paidAt,
        new Date("2026-07-15T00:00:00.001Z"),
      ),
    ).toBe(false);
  });
});
