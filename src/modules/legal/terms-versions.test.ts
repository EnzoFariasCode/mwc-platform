import { describe, expect, it } from "vitest";

import {
  GENERAL_TERMS_VERSION,
  PROFESSIONAL_TERMS,
  getProfessionalTerms,
} from "./terms-versions";

describe("versoes dos termos por setor", () => {
  it("mantem uma versao geral identificavel", () => {
    expect(GENERAL_TERMS_VERSION).toMatch(/^general-v\d+\.\d+$/);
  });

  it("usa documentos e versoes diferentes para Tech e Online", () => {
    expect(PROFESSIONAL_TERMS.TECH.version).not.toBe(
      PROFESSIONAL_TERMS.HEALTH.version,
    );
    expect(PROFESSIONAL_TERMS.TECH.href).not.toBe(
      PROFESSIONAL_TERMS.HEALTH.href,
    );
  });

  it("resolve somente o documento correspondente ao setor", () => {
    expect(getProfessionalTerms("TECH")).toEqual(PROFESSIONAL_TERMS.TECH);
    expect(getProfessionalTerms("HEALTH")).toEqual(
      PROFESSIONAL_TERMS.HEALTH,
    );
  });
});
