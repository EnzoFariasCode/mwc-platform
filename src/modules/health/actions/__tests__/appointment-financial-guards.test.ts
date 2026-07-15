import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let appointmentStatus = "CONFIRMED";
  let transactionStatus = "PENDING";
  let walletReleaseCount = 0;

  const appointmentFixture = () => ({
    id: "appointment-1",
    date: new Date("2026-07-15T00:00:00.000Z"),
    time: "10:00",
    durationMinutes: 50,
    timezonePro: "America/Sao_Paulo",
    price: 100,
    status: appointmentStatus,
    professionalId: "professional-1",
    stripeSessionId: "cs_test_1",
    notes: null,
    patient: { name: "Paciente", email: "paciente@example.com" },
    professional: {
      name: "Profissional",
      email: "pro@example.com",
    },
  });

  const tx = {
    appointment: {
      findUnique: vi.fn(async () => ({ ...appointmentFixture() })),
      updateMany: vi.fn(async ({ where, data }) => {
        if (
          where.id === "appointment-1" &&
          where.professionalId === "professional-1" &&
          where.status === "CONFIRMED" &&
          appointmentStatus === "CONFIRMED"
        ) {
          appointmentStatus = data.status;
          return { count: 1 };
        }

        return { count: 0 };
      }),
      update: vi.fn(async () => ({ id: "appointment-1" })),
    },
    transaction: {
      findFirst: vi.fn(async () =>
        transactionStatus === "PENDING"
          ? { id: "transaction-1", amount: 90 }
          : null,
      ),
      update: vi.fn(async ({ data }) => {
        transactionStatus = data.status;
        return { id: "transaction-1" };
      }),
    },
    user: {
      update: vi.fn(async () => {
        walletReleaseCount += 1;
        return { id: "professional-1" };
      }),
    },
  };

  const db = {
    $transaction: vi.fn(async (callback) => callback(tx)),
  };

  return {
    db,
    tx,
    reset() {
      appointmentStatus = "CONFIRMED";
      transactionStatus = "PENDING";
      walletReleaseCount = 0;
      vi.clearAllMocks();
    },
    getAppointmentStatus: () => appointmentStatus,
    getWalletReleaseCount: () => walletReleaseCount,
  };
});

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: {
      id: "professional-1",
      userType: "PROFESSIONAL",
      industry: "HEALTH",
    },
  })),
}));
vi.mock("@/lib/prisma", () => ({ db: mocks.db }));
vi.mock("@/lib/stripe", () => ({ stripe: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/modules/health/actions/slot-helpers", () => ({
  generateDaySlots: vi.fn(),
  parseAppointmentDateTime: vi.fn(),
}));
vi.mock(
  "@/modules/health/lib/appointment-completion-time",
  async () => await import("../../lib/appointment-completion-time"),
);
vi.mock("@/lib/action-rate-limit", () => ({ consumeRateLimit: vi.fn() }));
vi.mock("@/modules/admin/actions/audit-log", () => ({
  createAdminAuditLog: vi.fn(),
}));
vi.mock("@/modules/admin/services/admin-notification-service", () => ({
  sendAdminNotification: vi.fn(),
}));
vi.mock("@/modules/health/services/google-meet-service", () => ({
  cancelGoogleMeetEvent: vi.fn(),
  findGoogleMeetEventId: vi.fn(),
  updateGoogleMeetEvent: vi.fn(),
}));
vi.mock(
  "@/modules/health/services/appointment-cancellation-recovery",
  () => ({
    processAppointmentCancellation: vi.fn(),
    requestAppointmentCancellation: vi.fn(),
  }),
);
vi.mock("@/modules/health/services/transactional-email-service", () => ({
  sendAppointmentCompletedEmail: vi.fn(),
  sendCancellationEmail: vi.fn(),
  sendRefundProcessedEmail: vi.fn(),
  sendRescheduleEmail: vi.fn(),
}));

import {
  completeHealthAppointment,
  markPatientNoShowAppointment,
} from "../appointment-actions";

describe("health appointment financial guards", () => {
  beforeEach(() => {
    mocks.reset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T13:50:00.000Z"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterAll(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("rejects a direct completion call before the session ends", async () => {
    vi.setSystemTime(new Date("2026-07-15T13:49:59.999Z"));

    const result = await completeHealthAppointment("appointment-1");

    expect(result.error).toContain("termino previsto");
    expect(mocks.tx.appointment.updateMany).not.toHaveBeenCalled();
    expect(mocks.getWalletReleaseCount()).toBe(0);
  });

  it("rejects a second completion and releases the wallet only once", async () => {
    const first = await completeHealthAppointment("appointment-1");
    const second = await completeHealthAppointment("appointment-1");

    expect(first).toEqual({ success: true });
    expect(second.error).toContain("confirmadas");
    expect(mocks.getAppointmentStatus()).toBe("COMPLETED");
    expect(mocks.getWalletReleaseCount()).toBe(1);
  });

  it("allows only one winner between completion and no-show", async () => {
    const results = await Promise.all([
      completeHealthAppointment("appointment-1"),
      markPatientNoShowAppointment(
        "appointment-1",
        "Paciente nao entrou na sala durante o atendimento.",
      ),
    ]);

    expect(results.filter((result) => result.success)).toHaveLength(1);
    expect(results.filter((result) => result.error)).toHaveLength(1);
    expect(["COMPLETED", "NO_SHOW"]).toContain(
      mocks.getAppointmentStatus(),
    );
    expect(mocks.getWalletReleaseCount()).toBe(1);
  });
});
