import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let teachingSubject: string | null = "Matematica";
  let consultationFee: number | null = 100;
  let hasAvailability = true;
  const db = {
    user: {
      findMany: vi.fn(async () => [
        {
          id: "teacher-1",
          name: "Professor Teste",
          displayName: null,
          bio: null,
          rating: 0,
          ratingCount: 0,
          jobTitle: "Professor",
          onlineSpecialty: "TEACHER",
          teachingSubject,
          documentReg: null,
          consultationFee,
          industry: "HEALTH",
          image: null,
          sessionDuration: 50,
          approach: null,
          city: null,
          state: null,
          profileImageBytes: null,
          timezone: "America/Sao_Paulo",
          availabilities: hasAvailability
            ? [
                {
                  dayOfWeek: 1,
                  startTime: "09:00",
                  endTime: "18:00",
                  isActive: true,
                },
              ]
            : [],
        },
      ]),
    },
  };

  return {
    db,
    reset() {
      teachingSubject = "Matematica";
      consultationFee = 100;
      hasAvailability = true;
      vi.clearAllMocks();
    },
    setTeachingSubject(value: string | null) {
      teachingSubject = value;
    },
    setConsultationFee(value: number | null) {
      consultationFee = value;
    },
    setHasAvailability(value: boolean) {
      hasAvailability = value;
    },
  };
});

vi.mock("@/lib/prisma", () => ({ db: mocks.db }));

import { getProfessionalsBySpecialty } from "./get-professionals";

describe("busca de professores", () => {
  beforeEach(() => mocks.reset());

  it("exibe Professor com materia mesmo sem registro", async () => {
    const result = await getProfessionalsBySpecialty("professor");

    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]).toEqual(
      expect.objectContaining({
        onlineSpecialty: "TEACHER",
        teachingSubject: "Matematica",
      }),
    );
    expect(mocks.db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ onlineSpecialty: "TEACHER" }),
      }),
    );
  });

  it("retorna somente dados necessarios para a vitrine publica", async () => {
    const result = await getProfessionalsBySpecialty("professor");

    expect(result.data?.[0]).toEqual({
      id: "teacher-1",
      name: "Professor Teste",
      bio: null,
      rating: 0,
      jobTitle: "Professor",
      onlineSpecialty: "TEACHER",
      teachingSubject: "Matematica",
      sessionDuration: 50,
      consultationFee: 100,
      hasProfileImage: false,
    });
    expect(result.data?.[0]).not.toHaveProperty("documentReg");
    expect(result.data?.[0]).not.toHaveProperty("image");
    expect(result.data?.[0]).not.toHaveProperty("profileImageBytes");
    expect(result.data?.[0]).not.toHaveProperty("timezone");
  });

  it("rejeita identificador invalido sem consultar o banco", async () => {
    const result = await getProfessionalsBySpecialty("x".repeat(41));

    expect(result.data).toEqual([]);
    expect(mocks.db.user.findMany).not.toHaveBeenCalled();
  });

  it("mantem Professor sem materia fora dos resultados", async () => {
    mocks.setTeachingSubject(null);

    const result = await getProfessionalsBySpecialty("professor");

    expect(result.data).toEqual([]);
  });

  it("mantem profissional sem preco positivo fora dos resultados", async () => {
    mocks.setConsultationFee(0);

    const result = await getProfessionalsBySpecialty("professor");

    expect(result.data).toEqual([]);
  });

  it("mantem profissional sem agenda ativa fora dos resultados", async () => {
    mocks.setHasAvailability(false);

    const result = await getProfessionalsBySpecialty("professor");

    expect(result.data).toEqual([]);
  });
});
