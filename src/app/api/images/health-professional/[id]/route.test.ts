import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: { user: { findFirst: vi.fn() } },
}));

vi.mock("@/lib/prisma", () => ({ db: mocks.db }));

import { GET } from "./route";

const PROFESSIONAL_ID = "11111111-1111-4111-8111-111111111111";

describe("imagem publica do profissional Online", () => {
  beforeEach(() => vi.clearAllMocks());

  it("nao consulta o banco para id invalido", async () => {
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "invalido" }),
    });

    expect(response.status).toBe(404);
    expect(mocks.db.user.findFirst).not.toHaveBeenCalled();
  });

  it("serve somente imagem de profissional publicamente elegivel", async () => {
    mocks.db.user.findFirst.mockResolvedValue({
      profileImageBytes: Buffer.from("image"),
      profileImageType: "image/webp",
      onlineSpecialty: "TEACHER",
      teachingSubject: "Matematica",
      documentReg: null,
      jobTitle: "Professor",
      consultationFee: 100,
      sessionDuration: 50,
      timezone: "America/Sao_Paulo",
      availabilities: [
        {
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "18:00",
          isActive: true,
        },
      ],
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: PROFESSIONAL_ID }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(mocks.db.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: PROFESSIONAL_ID,
          userType: "PROFESSIONAL",
          industry: "HEALTH",
          isActive: true,
        }),
      }),
    );
  });

  it("nao revela se usuario inelegivel possui imagem", async () => {
    mocks.db.user.findFirst.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: PROFESSIONAL_ID }),
    });

    expect(response.status).toBe(404);
  });
});
