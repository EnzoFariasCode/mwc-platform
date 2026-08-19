import { beforeEach, describe, expect, it, vi } from "vitest";

const verifySession = vi.hoisted(() => vi.fn());
const appointmentFindUnique = vi.hoisted(() => vi.fn());
const holdFindUnique = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({ verifySession }));
vi.mock("@/lib/prisma", () => ({
  db: {
    appointment: { findUnique: appointmentFindUnique },
    appointmentHold: { findUnique: holdFindUnique },
  },
}));

import { getHealthPaymentStatus } from "./get-health-payment-status";

describe("getHealthPaymentStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySession.mockResolvedValue({ sub: "patient-1" });
  });

  it("only reads a webhook-created confirmed appointment", async () => {
    appointmentFindUnique.mockResolvedValueOnce({
      patientId: "patient-1",
      status: "CONFIRMED",
    });

    await expect(getHealthPaymentStatus("cs_1")).resolves.toEqual({
      state: "CONFIRMED",
      meetingState: "READY",
      message: "Pagamento e agendamento confirmados.",
    });
    expect(holdFindUnique).not.toHaveBeenCalled();
  });

  it("reports processing while the checkout hold awaits the webhook", async () => {
    appointmentFindUnique.mockResolvedValueOnce(null);
    holdFindUnique.mockResolvedValueOnce({ patientId: "patient-1" });

    await expect(getHealthPaymentStatus("cs_1")).resolves.toEqual({
      state: "PROCESSING",
      message:
        "A Stripe concluiu o checkout. Estamos aguardando a confirmacao automatica do webhook.",
    });
  });

  it("confirms the appointment while the meeting room is still pending", async () => {
    appointmentFindUnique.mockResolvedValueOnce({
      patientId: "patient-1",
      status: "MEETING_PENDING",
    });

    await expect(getHealthPaymentStatus("cs_1")).resolves.toEqual({
      state: "CONFIRMED",
      meetingState: "PROCESSING",
      message:
        "Agendamento confirmado. A sala online esta sendo preparada e aparecera no historico assim que estiver pronta.",
    });
    expect(holdFindUnique).not.toHaveBeenCalled();
  });

  it("keeps the paid appointment positive when the room needs attention", async () => {
    appointmentFindUnique.mockResolvedValueOnce({
      patientId: "patient-1",
      status: "MEETING_REQUIRES_ATTENTION",
    });

    await expect(getHealthPaymentStatus("cs_1")).resolves.toEqual({
      state: "CONFIRMED",
      meetingState: "REQUIRES_ATTENTION",
      message:
        "Agendamento confirmado. O pagamento esta protegido e nossa equipe esta concluindo a sala online.",
    });
  });

  it("keeps polling when the redirect wins the race against the webhook", async () => {
    appointmentFindUnique.mockResolvedValueOnce(null);
    holdFindUnique.mockResolvedValueOnce(null);

    await expect(getHealthPaymentStatus("cs_1")).resolves.toEqual({
      state: "PROCESSING",
      message:
        "A Stripe concluiu o checkout. Estamos aguardando a confirmacao automatica do webhook.",
    });
  });

  it("does not reveal another patient's payment", async () => {
    appointmentFindUnique.mockResolvedValueOnce({
      patientId: "patient-2",
      status: "CONFIRMED",
    });

    await expect(getHealthPaymentStatus("cs_1")).resolves.toEqual({
      state: "NOT_FOUND",
      message: "Pagamento nao autorizado.",
    });
  });
});
