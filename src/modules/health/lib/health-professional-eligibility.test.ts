import { describe, expect, it } from "vitest";
import {
  getHealthProfessionalBookingReadinessError,
  hasValidHealthProfessionalIdentity,
  hasValidTeachingSubject,
} from "./health-professional-eligibility";

const readyTeacher = {
  displayName: "Professora Maria",
  bio: "Aulas particulares de matematica.",
  approach: "Explicacao pratica e exercicios.",
  birthDate: new Date("1990-01-01"),
  phone: "(11) 99999-9999",
  hasProfileImage: true,
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
  professionalVerification: {
    specialty: "TEACHER",
    status: "APPROVED",
    expiresAt: null,
  },
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
    ["preco", { consultationFee: 0.99 }],
    ["duracao", { sessionDuration: 0 }],
    ["timezone", { timezone: "Fuso/Invalido" }],
    ["agenda", { availabilities: [] }],
    ["nome de exibicao", { displayName: " " }],
    ["biografia", { bio: " " }],
    ["abordagem", { approach: null }],
    ["data de nascimento", { birthDate: null }],
    ["telefone", { phone: " " }],
    ["foto", { hasProfileImage: false }],
    [
      "documentos pendentes",
      {
        professionalVerification: {
          specialty: "TEACHER",
          status: "UNDER_REVIEW",
        },
      },
    ],
    [
      "categoria da verificacao",
      { professionalVerification: { specialty: "PSYCHOLOGIST" } },
    ],
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
