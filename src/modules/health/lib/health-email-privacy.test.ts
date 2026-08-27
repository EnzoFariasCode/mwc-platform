import { describe, expect, it } from "vitest";

import {
  healthReasonCategoryForEmail,
  healthReasonEmailLine,
} from "./health-email-privacy";

describe("health email privacy", () => {
  it("retorna somente a categoria controlada e descarta o texto livre", () => {
    const reason =
      "Nao poderei comparecer: informacao clinica que nao deve sair por e-mail";

    expect(healthReasonCategoryForEmail(reason)).toBe(
      "Nao poderei comparecer",
    );
    expect(healthReasonEmailLine(reason)).toBe(
      "Categoria informada: Nao poderei comparecer.",
    );
    expect(healthReasonEmailLine(reason)).not.toContain("informacao clinica");
  });

  it("nao replica uma categoria forjada", () => {
    expect(
      healthReasonEmailLine("Diagnostico: conteudo clinico sensivel"),
    ).toBe("O motivo foi registrado com seguranca na plataforma.");
  });
});
