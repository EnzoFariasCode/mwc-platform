import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let patientId = "patient-1";
  let status = "COMPLETED";
  let existingReview = false;

  const tx = {
    appointment: {
      findUnique: vi.fn(async () => ({
        id: "appointment-1",
        status,
        patientId,
        professionalId: "professional-1",
        professional: {
          id: "professional-1",
          userType: "PROFESSIONAL",
          industry: "HEALTH",
          isActive: true,
        },
      })),
    },
    $queryRaw: vi.fn(async () => [{ id: "professional-1" }]),
    healthAppointmentReview: {
      findUnique: vi.fn(async () =>
        existingReview ? { id: "review-existing" } : null,
      ),
      create: vi.fn(async () => ({ id: "review-1" })),
      aggregate: vi.fn(async () => ({
        _avg: { rating: 4.5 },
        _count: { _all: 2 },
      })),
    },
    user: { update: vi.fn() },
  };
  const db = {
    $transaction: vi.fn(async (callback) => callback(tx)),
  };

  return {
    db,
    tx,
    reset() {
      patientId = "patient-1";
      status = "COMPLETED";
      existingReview = false;
      vi.clearAllMocks();
    },
    setPatientId(value: string) {
      patientId = value;
    },
    setStatus(value: string) {
      status = value;
    },
    setExistingReview(value: boolean) {
      existingReview = value;
    },
  };
});

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "patient-1" } })),
}));
vi.mock("@/lib/prisma", () => ({ db: mocks.db }));
vi.mock("@/lib/action-rate-limit", () => ({
  consumeRateLimit: vi.fn(async () => null),
}));
vi.mock("@/modules/notifications/services/notification-service", () => ({
  upsertNotification: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { submitHealthAppointmentReview } from "./submit-health-appointment-review";

describe("submitHealthAppointmentReview", () => {
  beforeEach(() => {
    mocks.reset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("rejects a direct call from a user who is not the patient", async () => {
    mocks.setPatientId("another-patient");

    const result = await submitHealthAppointmentReview(
      "appointment-1",
      5,
      "Bom atendimento",
    );

    expect(result.success).toBe(false);
    expect(mocks.tx.healthAppointmentReview.create).not.toHaveBeenCalled();
  });

  it("rejects reviews before the appointment is completed", async () => {
    mocks.setStatus("CONFIRMED");

    const result = await submitHealthAppointmentReview("appointment-1", 5);

    expect(result.error).toContain("concluidas");
    expect(mocks.tx.healthAppointmentReview.create).not.toHaveBeenCalled();
  });

  it("rejects a second review for the same appointment", async () => {
    mocks.setExistingReview(true);

    const result = await submitHealthAppointmentReview("appointment-1", 5);

    expect(result.error).toContain("ja foi avaliada");
    expect(mocks.tx.healthAppointmentReview.create).not.toHaveBeenCalled();
  });

  it("creates the review and recalculates the professional reputation", async () => {
    const result = await submitHealthAppointmentReview(
      "appointment-1",
      5,
      "  Excelente atendimento.  ",
    );

    expect(result).toEqual({ success: true });
    expect(mocks.tx.healthAppointmentReview.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        appointmentId: "appointment-1",
        authorId: "patient-1",
        professionalId: "professional-1",
        rating: 5,
        comment: "Excelente atendimento.",
      }),
      select: { id: true },
    });
    expect(mocks.tx.user.update).toHaveBeenCalledWith({
      where: { id: "professional-1" },
      data: { rating: 4.5, ratingCount: 2 },
    });
  });
});
