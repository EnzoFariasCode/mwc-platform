import { describe, expect, it } from "vitest";
import {
  hasValidHealthProfessionalIdentity,
  hasValidTeachingSubject,
} from "./health-professional-eligibility";

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
