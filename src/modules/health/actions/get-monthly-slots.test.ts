import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    user: { findFirst: vi.fn() },
    availabilityException: { findMany: vi.fn() },
    appointment: { findMany: vi.fn() },
    appointmentHold: { findMany: vi.fn() },
  },
  consumeRateLimit: vi.fn(),
  getRateLimitKeys: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ db: mocks.db }));
vi.mock("@/lib/action-rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
}));
vi.mock("@/lib/rate-limit", () => ({
  getRateLimitKeys: mocks.getRateLimitKeys,
}));

import { getMonthlySlots } from "./get-monthly-slots";

const PROFESSIONAL_ID = "11111111-1111-4111-8111-111111111111";

describe("agenda publica mensal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 17, 8, 0, 0));
    vi.clearAllMocks();
    mocks.getRateLimitKeys.mockResolvedValue(["slots:test"]);
    mocks.consumeRateLimit.mockResolvedValue(null);
    mocks.db.user.findFirst.mockResolvedValue({
      sessionDuration: 50,
      availabilities: [
        {
          dayOfWeek: 5,
          startTime: "09:00",
          endTime: "11:00",
          isActive: true,
        },
      ],
    });
    mocks.db.availabilityException.findMany.mockResolvedValue([]);
    mocks.db.appointment.findMany.mockResolvedValue([]);
    mocks.db.appointmentHold.findMany.mockResolvedValue([]);
  });

  afterEach(() => vi.useRealTimers());

  it("rejeita id e mes manipulados antes de consultar o banco", async () => {
    await expect(getMonthlySlots("nao-e-uuid", "2026-07")).resolves.toEqual({
      slots: {},
      error: "Agenda solicitada invalida.",
    });
    await expect(getMonthlySlots(PROFESSIONAL_ID, "2027-01")).resolves.toEqual({
      slots: {},
      error: "Mes fora da janela de agendamento.",
    });
    expect(mocks.db.user.findFirst).not.toHaveBeenCalled();
  });

  it("usa a duracao persistida no servidor para gerar horarios", async () => {
    const result = await getMonthlySlots(PROFESSIONAL_ID, "2026-07");

    expect(result.error).toBeUndefined();
    expect(result.slots["2026-07-17"]).toEqual(["09:00", "09:50"]);
    expect(mocks.db.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: PROFESSIONAL_ID }),
        select: expect.objectContaining({ sessionDuration: true }),
      }),
    );
  });

  it("remove agendamentos e holds ativos da resposta publica", async () => {
    mocks.db.appointment.findMany.mockResolvedValue([
      { date: new Date(2026, 6, 17), time: "09:00" },
    ]);
    mocks.db.appointmentHold.findMany.mockResolvedValue([
      { date: new Date(2026, 6, 17), time: "09:50" },
    ]);

    const result = await getMonthlySlots(PROFESSIONAL_ID, "2026-07");

    expect(result.slots["2026-07-17"]).toBeUndefined();
  });

  it("bloqueia abuso por excesso de consultas", async () => {
    mocks.consumeRateLimit.mockResolvedValue("Limite excedido.");

    const result = await getMonthlySlots(PROFESSIONAL_ID, "2026-07");

    expect(result).toEqual({ slots: {}, error: "Limite excedido." });
    expect(mocks.db.user.findFirst).not.toHaveBeenCalled();
  });

  it("recusa duracao corrompida sem entrar em geracao de slots", async () => {
    mocks.db.user.findFirst.mockResolvedValue({
      sessionDuration: 0,
      availabilities: [],
    });

    const result = await getMonthlySlots(PROFESSIONAL_ID, "2026-07");

    expect(result).toEqual({
      slots: {},
      error: "Profissional indisponivel para agendamento.",
    });
    expect(mocks.db.appointment.findMany).not.toHaveBeenCalled();
  });
});
