import { beforeEach, describe, expect, it, vi } from "vitest";

const appointmentFindMany = vi.hoisted(() => vi.fn());
const emailOutboxFindMany = vi.hoisted(() => vi.fn());
const ensureAppointmentPaymentConfirmedEmails = vi.hoisted(() => vi.fn());
const transaction = vi.hoisted(() =>
  vi.fn(async (callback: (client: object) => Promise<unknown>) => callback({})),
);

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  db: {
    appointment: { findMany: appointmentFindMany },
    emailOutbox: { findMany: emailOutboxFindMany },
    $transaction: transaction,
  },
}));
vi.mock("@/modules/health/services/transactional-email-service", () => ({
  ensureAppointmentPaymentConfirmedEmails,
}));

import { recoverMissingAppointmentConfirmationEmails } from "./appointment-confirmation-email-recovery";

describe("appointment confirmation email recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureAppointmentPaymentConfirmedEmails.mockResolvedValue(undefined);
  });

  it("repairs only paid appointments missing one or both recipients", async () => {
    appointmentFindMany.mockResolvedValue([
      { id: "appointment-1", patientId: "patient-1", professionalId: "pro-1" },
      { id: "appointment-2", patientId: "patient-2", professionalId: "pro-2" },
    ]);
    emailOutboxFindMany.mockResolvedValue([
      { entityId: "appointment-1", recipientUserId: "patient-1" },
      { entityId: "appointment-1", recipientUserId: "pro-1" },
      { entityId: "appointment-2", recipientUserId: "patient-2" },
    ]);

    await expect(
      recoverMissingAppointmentConfirmationEmails({
        now: new Date("2026-08-26T12:00:00.000Z"),
      }),
    ).resolves.toEqual({ inspected: 2, missing: 1, repaired: 1, failed: 0 });

    expect(ensureAppointmentPaymentConfirmedEmails).toHaveBeenCalledOnce();
    expect(ensureAppointmentPaymentConfirmedEmails).toHaveBeenCalledWith(
      expect.any(Object),
      "appointment-2",
    );
  });

  it("does not create duplicate records when both recipients already exist", async () => {
    appointmentFindMany.mockResolvedValue([
      { id: "appointment-1", patientId: "patient-1", professionalId: "pro-1" },
    ]);
    emailOutboxFindMany.mockResolvedValue([
      { entityId: "appointment-1", recipientUserId: "patient-1" },
      { entityId: "appointment-1", recipientUserId: "pro-1" },
    ]);

    await expect(recoverMissingAppointmentConfirmationEmails()).resolves.toEqual({
      inspected: 1,
      missing: 0,
      repaired: 0,
      failed: 0,
    });
    expect(transaction).not.toHaveBeenCalled();
  });
});
