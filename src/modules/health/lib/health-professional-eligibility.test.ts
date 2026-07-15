import { describe, expect, it } from "vitest";
import {
  getHealthProfessionalBookingReadinessError,
  hasValidHealthProfessionalIdentity,
  hasValidTeachingSubject,
} from "./health-professional-eligibility";

const readyTeacher = {
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
};

describe("identidade profissional do MWC Online", () => {
  it("habilita Professor com materia e sem registro", () => {
    expect(
      hasValidHealthProfessionalIdentity({
        onlineSpecialty: "TEACHER",
        teachingSubject: "Ingles",
        documentReg: null,
      }),
    ).toBe(true);
  });

  it("mantem Professor sem materia inelegivel", () => {
    expect(hasValidTeachingSubject("   ")).toBe(false);
    expect(
      hasValidHealthProfessionalIdentity({
        onlineSpecialty: "TEACHER",
        teachingSubject: "",
        documentReg: "CRM - 123",
      }),
    ).toBe(false);
  });

  it.each(["PSYCHOLOGIST", "NUTRITIONIST", "PERSONAL_TRAINER", "LAWYER"])(
    "exige registro para %s",
    (onlineSpecialty) => {
      expect(
        hasValidHealthProfessionalIdentity({
          onlineSpecialty,
          teachingSubject: null,
          documentReg: null,
        }),
      ).toBe(false);
      expect(
        hasValidHealthProfessionalIdentity({
          onlineSpecialty,
          teachingSubject: null,
          documentReg: "REG - 123",
        }),
      ).toBe(true);
    },
  );
});

describe("prontidao para agendamento do MWC Online", () => {
  it("aceita apenas o perfil com identidade, preco e agenda validos", () => {
    expect(getHealthProfessionalBookingReadinessError(readyTeacher)).toBeNull();
  });

  it.each([
    ["titulo", { jobTitle: " " }],
    ["preco", { consultationFee: 0 }],
    ["duracao", { sessionDuration: 0 }],
    ["timezone", { timezone: "Fuso/Invalido" }],
    ["agenda", { availabilities: [] }],
    [
      "periodo invertido",
      {
        availabilities: [
          {
            dayOfWeek: 1,
            startTime: "18:00",
            endTime: "09:00",
            isActive: true,
          },
        ],
      },
    ],
  ])("rejeita perfil com %s invalido", (_label, changes) => {
    expect(
      getHealthProfessionalBookingReadinessError({
        ...readyTeacher,
        ...changes,
      }),
    ).not.toBeNull();
  });
});
