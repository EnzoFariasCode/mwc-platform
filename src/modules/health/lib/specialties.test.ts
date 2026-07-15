import { describe, expect, it } from "vitest";

import {
  getHealthSpecialtyById,
  getHealthSpecialtySearchIds,
  getOnlineSpecialtyByJobTitle,
} from "./specialties";

describe("taxonomia de Advocacia", () => {
  it("usa advocacia como slug canonico do MWC Online", () => {
    expect(getHealthSpecialtyById("advocacia")?.id).toBe("advocacia");
  });

  it("preserva advogado apenas como alias legado", () => {
    const specialty = getHealthSpecialtyById("advogado");

    expect(specialty?.id).toBe("advocacia");
    expect(specialty && getHealthSpecialtySearchIds(specialty)).toEqual([
      "advocacia",
      "advogado",
    ]);
  });
});

describe("taxonomia de Professor", () => {
  it("usa professor como slug canonico do MWC Online", () => {
    expect(getHealthSpecialtyById("professor")?.id).toBe("professor");
    expect(getHealthSpecialtyById("professor")?.name).toBe("Professor");
    expect(getHealthSpecialtyById("professor")?.code).toBe("TEACHER");
  });

  it("preserva ingles apenas como alias legado", () => {
    const specialty = getHealthSpecialtyById("ingles");

    expect(specialty?.id).toBe("professor");
    expect(specialty && getHealthSpecialtySearchIds(specialty)).toEqual([
      "professor",
      "ingles",
    ]);
  });
});

describe("categoria persistida do MWC Online", () => {
  it.each([
    ["Psicologo(a)", "PSYCHOLOGIST"],
    ["Nutricionista", "NUTRITIONIST"],
    ["Personal Trainer", "PERSONAL_TRAINER"],
    ["Professor", "TEACHER"],
    ["Advogado(a)", "LAWYER"],
  ])("mapeia %s para %s", (jobTitle, expectedCode) => {
    expect(getOnlineSpecialtyByJobTitle(jobTitle)?.code).toBe(expectedCode);
  });

  it("nao inventa categoria para um titulo desconhecido", () => {
    expect(getOnlineSpecialtyByJobTitle("Categoria inexistente")).toBeNull();
  });
});
