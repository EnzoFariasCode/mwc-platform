import { describe, expect, it } from "vitest";

import {
  normalizeOptionalPersonName,
  normalizePersonName,
} from "./normalize-person-name";

describe("normalizePersonName", () => {
  it("converte caixa alta para apenas a primeira letra maiuscula", () => {
    expect(normalizePersonName("JOÃO DA SILVA")).toBe("João da silva");
  });

  it("normaliza caixa mista, acentos e espacos repetidos", () => {
    expect(normalizePersonName("  mÁRIA   D'ÁVILA  ")).toBe(
      "Mária d'ávila",
    );
  });

  it("coloca em maiuscula a primeira letra real do valor", () => {
    expect(normalizePersonName("123 JOÃO SILVA")).toBe("123 João silva");
  });

  it("converte valores opcionais vazios para null", () => {
    expect(normalizeOptionalPersonName("   ")).toBeNull();
    expect(normalizeOptionalPersonName(null)).toBeNull();
  });
});
