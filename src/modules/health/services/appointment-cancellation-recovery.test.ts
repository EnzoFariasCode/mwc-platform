import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const baseProcess = () => ({
    id: "cancel-1",
    appointmentId: "appointment-1",
    requestedById: "professional-1",
    initiator: "PROFESSIONAL",
    reason: "Imprevisto profissional",
    status: "PENDING",
    attemptCount: 0,
    maxAttempts: 3,
    nextAttemptAt: new Date(0),
    processingStartedAt: null as Date | null,
    lastAttemptAt: null as Date | null,
    lastError: null as string | null,
    meetStatus: "PENDING",
    meetCanceledAt: null as Date | null,
    meetLastError: null as string | null,
    refundStatus: "PENDING",
    refundId: null as string | null,
    refundedAt: null as Date | null,
    refundLastError: null as string | null,
    escrowStatus: "PENDING",
    escrowCanceledAt: null as Date | null,
    escrowLastError: null as string | null,
    reconciliationRequiredAt: null as Date | null,
    reconciliationAlertedAt: null as Date | null,
    completedAt: null as Date | null,
    completionNotifiedAt: null as Date | null,
  });
  const appointment = {
    id: "appointment-1",
    date: new Date("2026-07-20T00:00:00.000Z"),
    time: "10:00",
    durationMinutes: 50,
    timezonePro: "America/Sao_Paulo",
    status: "CANCELLING",
    stripeSessionId: "cs_1",
    meetLink: "https://meet.google.com/abc-defg-hij",
    googleEventId: "event-1",
    professionalId: "professional-1",
    patientId: "patient-1",
    price: 100,
    notes: null as string | null,
    patient: { name: "Paciente", email: "patient@example.com" },
    professional: { name: "Profissional", email: "pro@example.com" },
  };
  let process = baseProcess();
  let creditStatus = "PENDING";
  let pendingBalanceDecrements = 0;

  const relatedProcess = () => ({ ...process, appointment: { ...appointment } });
  const processModel = {
    updateMany: vi.fn(async ({ where, data }) => {
      if (where.id !== process.id) return { count: 0 };
      if (where.reconciliationAlertedAt === null && process.reconciliationAlertedAt) {
        return { count: 0 };
      }
      if (where.OR) {
        const claimable =
          ["PENDING", "RETRY_SCHEDULED"].includes(process.status) ||
          process.status === "PROCESSING";
        if (!claimable) return { count: 0 };
      }
      if (data.attemptCount?.increment) {
        process.attemptCount += data.attemptCount.increment;
      }
      process = { ...process, ...data, attemptCount: process.attemptCount };
      return { count: 1 };
    }),
    update: vi.fn(async ({ data }) => {
      process = { ...process, ...data };
      return relatedProcess();
    }),
    findUnique: vi.fn(async () => relatedProcess()),
    findUniqueOrThrow: vi.fn(async () => relatedProcess()),
    findMany: vi.fn(async () => [{ id: process.id }]),
    create: vi.fn(),
  };
  const db = {
    appointmentCancellationProcess: processModel,
    appointment: {
      update: vi.fn(async ({ data }) => Object.assign(appointment, data)),
      updateMany: vi.fn(async ({ where, data }) => {
        if (where.status && appointment.status !== where.status) return { count: 0 };
        Object.assign(appointment, data);
        return { count: 1 };
      }),
    },
    transaction: {
      findFirst: vi.fn(async () => ({
        id: "credit-1",
        amount: 90,
        status: creditStatus,
      })),
      updateMany: vi.fn(async ({ where, data }) => {
        if (where.status !== creditStatus) return { count: 0 };
        creditStatus = data.status;
        return { count: 1 };
      }),
    },
    user: {
      update: vi.fn(async () => {
        pendingBalanceDecrements += 1;
      }),
      findMany: vi.fn(async () => [
        { id: "admin-1", email: "admin@example.com" },
      ]),
    },
    $transaction: vi.fn(async (callback) => callback(db)),
  };

  return {
    db,
    reset() {
      process = baseProcess();
      appointment.status = "CANCELLING";
      appointment.notes = null;
      creditStatus = "PENDING";
      pendingBalanceDecrements = 0;
      vi.clearAllMocks();
    },
    makeRetryDue() {
      process.nextAttemptAt = new Date(0);
    },
    process: () => process,
    appointment,
    pendingBalanceDecrements: () => pendingBalanceDecrements,
  };
});

const googleCancel = vi.hoisted(() => vi.fn());
const refundCreate = vi.hoisted(() => vi.fn());
const refundList = vi.hoisted(() => vi.fn());
const checkoutRetrieve = vi.hoisted(() => vi.fn());
const upsertNotification = vi.hoisted(() => vi.fn());
const enqueueHealthOperationalAttentionEmail = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/modules/health/lib/appointment-completion-time", () => ({
  getAppointmentStartAt: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ db: mocks.db }));
vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: { sessions: { retrieve: checkoutRetrieve } },
    refunds: {
      list: refundList,
      create: refundCreate,
      retrieve: vi.fn(async () => ({ id: "re_1", status: "succeeded" })),
    },
  },
}));
vi.mock("@/modules/notifications/services/notification-service", () => ({
  upsertNotification,
}));
vi.mock("@/modules/health/services/transactional-email-service", () => ({
  enqueueCancellationEmails: vi.fn(),
  enqueueHealthOperationalAttentionEmail,
}));
vi.mock("@/modules/health/services/google-meet-service", () => ({
  cancelGoogleMeetEventIdempotently: googleCancel,
  findGoogleMeetEventForCancellation: vi.fn(),
}));

import { processAppointmentCancellation } from "./appointment-cancellation-recovery";

describe("appointment cancellation recovery", () => {
  beforeEach(() => {
    mocks.reset();
    checkoutRetrieve.mockResolvedValue({ payment_intent: "pi_1" });
    refundList.mockResolvedValue({ data: [] });
    refundCreate.mockResolvedValue({ id: "re_1", status: "succeeded" });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("refunds and cancels escrow even when Meet fails, then retries only Meet", async () => {
    googleCancel
      .mockResolvedValueOnce({ status: "FAILED", error: "Google indisponivel" })
      .mockResolvedValueOnce({ status: "ALREADY_CANCELED" });

    const first = await processAppointmentCancellation("cancel-1");

    expect(first.status).toBe("PENDING");
    expect(mocks.process().refundStatus).toBe("COMPLETED");
    expect(mocks.process().escrowStatus).toBe("COMPLETED");
    expect(mocks.process().meetStatus).toBe("PENDING");
    expect(mocks.pendingBalanceDecrements()).toBe(1);
    expect(refundCreate).toHaveBeenCalledTimes(1);

    mocks.makeRetryDue();
    const second = await processAppointmentCancellation("cancel-1");

    expect(second.status).toBe("COMPLETED");
    expect(mocks.appointment.status).toBe("CANCELED");
    expect(refundCreate).toHaveBeenCalledTimes(1);
    expect(mocks.pendingBalanceDecrements()).toBe(1);
  });

  it("moves the process to manual reconciliation after three failed attempts", async () => {
    googleCancel.mockResolvedValue({
      status: "FAILED",
      error: "Google indisponivel",
    });
    checkoutRetrieve.mockRejectedValue(new Error("Stripe indisponivel"));

    for (let attempt = 0; attempt < 3; attempt += 1) {
      mocks.makeRetryDue();
      await processAppointmentCancellation("cancel-1");
    }

    expect(mocks.process().status).toBe("RECONCILIATION_REQUIRED");
    expect(mocks.process().attemptCount).toBe(3);
    expect(upsertNotification).toHaveBeenCalled();
    expect(enqueueHealthOperationalAttentionEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        recipient: expect.objectContaining({ email: "admin@example.com" }),
      }),
    );
  });
});
