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
    });
    expect(holdFindUnique).not.toHaveBeenCalled();
  });

  it("reports processing while the checkout hold awaits the webhook", async () => {
    appointmentFindUnique.mockResolvedValueOnce(null);
    holdFindUnique.mockResolvedValueOnce({ patientId: "patient-1" });

    await expect(getHealthPaymentStatus("cs_1")).resolves.toEqual({
      state: "PROCESSING",
      message:
        "Pagamento recebido pela Stripe. Aguardando a confirmacao automatica do webhook.",
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
