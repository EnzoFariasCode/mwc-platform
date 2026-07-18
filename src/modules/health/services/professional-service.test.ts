import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: { user: { findFirst: vi.fn() } },
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

import { getHealthProfessionalById } from "./professional-service";

const PROFESSIONAL_ID = "11111111-1111-4111-8111-111111111111";

function readyProfessional() {
  return {
    id: PROFESSIONAL_ID,
    name: "Nome Civil Completo",
    displayName: "Dra. Exemplo",
    bio: "Apresentacao publica",
    jobTitle: "Psicologa",
    onlineSpecialty: "PSYCHOLOGIST",
    teachingSubject: null,
    documentReg: "CRP - 12345",
    approach: "TCC",
    consultationFee: 180,
    sessionDuration: 50,
    timezone: "America/Sao_Paulo",
    rating: 5,
    ratingCount: 1,
    city: "Sao Paulo",
    state: "SP",
    profileImageBytes: Buffer.from("image"),
    availabilities: [
      {
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "18:00",
        isActive: true,
      },
    ],
    healthReviewsReceived: [
      {
        id: "review-1",
        rating: 5,
        comment: "Otimo atendimento",
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
        author: { name: "Paciente Sobrenome", displayName: null },
      },
    ],
  };
}

describe("perfil publico do profissional Online", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRateLimitKeys.mockResolvedValue(["profile:test"]);
    mocks.consumeRateLimit.mockResolvedValue(null);
    mocks.db.user.findFirst.mockResolvedValue(readyProfessional());
  });

  it("rejeita id manipulado antes de consultar banco ou rate limit", async () => {
    await expect(getHealthProfessionalById("id-invalido")).resolves.toBeNull();

    expect(mocks.getRateLimitKeys).not.toHaveBeenCalled();
    expect(mocks.db.user.findFirst).not.toHaveBeenCalled();
  });

  it("oculta nome civil e campos internos do payload publico", async () => {
    const result = await getHealthProfessionalById(PROFESSIONAL_ID);

    expect(result).toEqual(
      expect.objectContaining({
        id: PROFESSIONAL_ID,
        name: "Dra. Exemplo",
        consultationFee: 180,
        hasProfileImage: true,
      }),
    );
    expect(result).not.toHaveProperty("displayName");
    expect(result).not.toHaveProperty("timezone");
    expect(result).not.toHaveProperty("availabilities");
    expect(result).not.toHaveProperty("profileImageBytes");
    expect(JSON.stringify(result)).not.toContain("Nome Civil Completo");
  });

  it("reduz o nome do autor da avaliacao", async () => {
    const result = await getHealthProfessionalById(PROFESSIONAL_ID);

    expect(result?.reviews[0]?.authorName).toBe("Paciente S.");
  });

  it("limita enumeracao automatizada de perfis", async () => {
    mocks.consumeRateLimit.mockResolvedValue("Limite excedido");

    await expect(getHealthProfessionalById(PROFESSIONAL_ID)).rejects.toThrow(
      "Limite excedido",
    );
    expect(mocks.db.user.findFirst).not.toHaveBeenCalled();
  });
});
