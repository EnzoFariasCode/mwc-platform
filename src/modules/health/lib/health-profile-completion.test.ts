import { describe, expect, it } from "vitest";
import { getHealthProfileCompletion } from "./health-profile-completion";

const completeProfile = {
  displayName: "Profissional",
  bio: "Apresentacao profissional",
  jobTitle: "Professor",
  onlineSpecialty: "TEACHER",
  teachingSubject: "Matematica",
  documentReg: null,
  professionalVerification: { status: "APPROVED", expiresAt: null },
  approach: "Aulas praticas",
  consultationFee: 100,
  sessionDuration: 50,
  timezone: "America/Sao_Paulo",
  hasProfileImage: true,
  birthDate: new Date("1990-01-01"),
  phone: "(11) 99999-9999",
  cep: "01000-000",
  address: "Rua Teste",
  addressNumber: "10",
  neighborhood: "Centro",
  city: "Sao Paulo",
  state: "SP",
  availabilities: [
    { dayOfWeek: 1, isActive: true, startTime: "09:00", endTime: "18:00" },
  ],
};

describe("progresso do perfil Online", () => {
  it("considera completos os tres locais de configuracao", () => {
    const completion = getHealthProfileCompletion(completeProfile);

    expect(completion.percent).toBe(100);
    expect(completion.done).toBe(completion.total);
    expect(completion.sections).toEqual({
      professional: true,
      schedule: true,
      personal: true,
    });
  });

  it("indica separadamente perfil, agenda e dados pessoais pendentes", () => {
    const completion = getHealthProfileCompletion({
      ...completeProfile,
      teachingSubject: null,
      availabilities: [],
      phone: null,
    });

    expect(completion.percent).toBeLessThan(100);
    expect(completion.sections).toEqual({
      professional: false,
      schedule: false,
      personal: false,
    });
    expect(completion.missingItems.map((item) => item.key)).toEqual(
      expect.arrayContaining(["identity", "schedule", "phone"]),
    );
  });
});
