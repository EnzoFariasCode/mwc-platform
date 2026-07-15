import { describe, expect, it } from "vitest";
import { validateProfessionalVerificationApproval } from "./professional-verification-review";

const psychologist = {
  specialty: "PSYCHOLOGIST" as const,
  council: "CRP" as const,
  registrationNumber: "12345",
  registrationRegion: "06",
  qualificationTitle: null,
  documentTypes: ["IDENTITY_DOCUMENT", "PROFESSIONAL_CREDENTIAL"] as const,
  checkResult: "ACTIVE" as const,
  sourceUrl: "https://cadastro.cfp.org.br/cfp/",
};

describe("aprovacao administrativa da verificacao", () => {
  it("aceita profissional regulamentado completo e ativo", () => {
    expect(
      validateProfessionalVerificationApproval({
        ...psychologist,
        documentTypes: [...psychologist.documentTypes],
      }),
    ).toBeNull();
  });

  it("rejeita conselho incompatível mesmo por chamada direta", () => {
    expect(
      validateProfessionalVerificationApproval({
        ...psychologist,
        council: "OAB",
        documentTypes: [...psychologist.documentTypes],
      }),
    ).toContain("incompativel");
  });

  it("rejeita documento ausente ou registro inativo", () => {
    expect(
      validateProfessionalVerificationApproval({
        ...psychologist,
        documentTypes: ["IDENTITY_DOCUMENT"],
      }),
    ).toContain("todos os documentos");
    expect(
      validateProfessionalVerificationApproval({
        ...psychologist,
        checkResult: "INACTIVE",
        documentTypes: [...psychologist.documentTypes],
      }),
    ).toContain("registro ativo");
  });

  it("aprova professor somente com identidade e qualificacao", () => {
    expect(
      validateProfessionalVerificationApproval({
        specialty: "TEACHER",
        council: "NOT_APPLICABLE",
        registrationNumber: null,
        registrationRegion: null,
        qualificationTitle: "Licenciatura em Matematica",
        documentTypes: ["IDENTITY_DOCUMENT", "QUALIFICATION_DOCUMENT"],
        checkResult: "NOT_APPLICABLE",
        sourceUrl: null,
      }),
    ).toBeNull();
  });
});
