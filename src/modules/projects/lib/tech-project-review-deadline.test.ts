import { describe, expect, it } from "vitest";
import {
  getTechProjectReviewDeadline,
  isTechProjectReviewExpired,
  TECH_PROJECT_REVIEW_DAYS,
} from "./tech-project-review-deadline";

describe("tech project review deadline", () => {
  it("sets the deadline seven days after delivery", () => {
    const deliveredAt = new Date("2026-07-14T12:00:00.000Z");

    expect(TECH_PROJECT_REVIEW_DAYS).toBe(7);
    expect(getTechProjectReviewDeadline(deliveredAt).toISOString()).toBe(
      "2026-07-21T12:00:00.000Z",
    );
  });

  it("expires exactly at the deadline", () => {
    const deadline = new Date("2026-07-21T12:00:00.000Z");

    expect(
      isTechProjectReviewExpired(
        deadline,
        new Date("2026-07-21T11:59:59.999Z"),
      ),
    ).toBe(false);
    expect(isTechProjectReviewExpired(deadline, deadline)).toBe(true);
  });
});
