import { describe, expect, it } from "vitest";
import {
  expectedCouncilForSpecialty,
  isProfessionalVerificationApproved,
  requiredVerificationDocuments,
} from "./professional-verification-policy";

describe("politica de verificacao profissional", () => {
  it("fixa o conselho correto para cada categoria regulamentada", () => {
    expect(expectedCouncilForSpecialty("PSYCHOLOGIST")).toBe("CRP");
    expect(expectedCouncilForSpecialty("NUTRITIONIST")).toBe("CRN");
    expect(expectedCouncilForSpecialty("PERSONAL_TRAINER")).toBe("CREF");
    expect(expectedCouncilForSpecialty("LAWYER")).toBe("OAB");
    expect(expectedCouncilForSpecialty("TEACHER")).toBe("NOT_APPLICABLE");
  });

  it("exige credencial profissional para regulamentados e qualificacao para professor", () => {
    expect(requiredVerificationDocuments("PSYCHOLOGIST")).toEqual([
      "IDENTITY_DOCUMENT",
      "PROFESSIONAL_CREDENTIAL",
    ]);
    expect(requiredVerificationDocuments("TEACHER")).toEqual([
      "IDENTITY_DOCUMENT",
      "QUALIFICATION_DOCUMENT",
    ]);
  });

  it("nao considera aprovada uma verificacao vencida", () => {
    const now = new Date("2026-07-16T12:00:00Z");
    expect(
      isProfessionalVerificationApproved(
        { status: "APPROVED", expiresAt: "2026-07-16T11:59:59Z" },
        now,
      ),
    ).toBe(false);
    expect(
      isProfessionalVerificationApproved(
        { status: "APPROVED", expiresAt: "2027-07-16T12:00:00Z" },
        now,
      ),
    ).toBe(true);
  });
});
