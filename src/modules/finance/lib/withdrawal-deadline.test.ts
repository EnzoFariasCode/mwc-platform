import { describe, expect, it } from "vitest";
import {
  calculateWithdrawalDueAt,
  WITHDRAWAL_PAYMENT_BUSINESS_DAYS,
} from "./withdrawal-deadline";

describe("withdrawal deadline", () => {
  it("adds twelve business days and skips weekends", () => {
    const requestedAt = new Date(2026, 6, 17, 10, 30);
    const dueAt = calculateWithdrawalDueAt(requestedAt);

    expect(WITHDRAWAL_PAYMENT_BUSINESS_DAYS).toBe(12);
    expect(dueAt.getFullYear()).toBe(2026);
    expect(dueAt.getMonth()).toBe(7);
    expect(dueAt.getDate()).toBe(4);
    expect(dueAt.getHours()).toBe(10);
    expect(dueAt.getMinutes()).toBe(30);
  });
});
