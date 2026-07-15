import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let teachingSubject: string | null = "Matematica";
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
          consultationFee: 100,
          industry: "HEALTH",
          image: null,
          sessionDuration: 50,
          approach: null,
          city: null,
          state: null,
          profileImageBytes: null,
        },
      ]),
    },
  };

  return {
    db,
    reset() {
      teachingSubject = "Matematica";
      vi.clearAllMocks();
    },
    setTeachingSubject(value: string | null) {
      teachingSubject = value;
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
        documentReg: null,
      }),
    );
    expect(mocks.db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ onlineSpecialty: "TEACHER" }),
      }),
    );
  });

  it("mantem Professor sem materia fora dos resultados", async () => {
    mocks.setTeachingSubject(null);

    const result = await getProfessionalsBySpecialty("professor");

    expect(result.data).toEqual([]);
  });
});
