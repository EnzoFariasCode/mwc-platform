import { describe, expect, it } from "vitest";
import { isSensitiveOnlineRoute } from "./cookie-consent";

describe("cookie consent route policy", () => {
  it.each([
    "/agendar-consulta",
    "/agendar-consulta/perfil/pro-1",
    "/agendar-consulta/prontuario/patient-1",
    "/checkout-saude",
    "/checkout-saude/sucesso",
  ])("protege a rota sensivel %s", (pathname) => {
    expect(isSensitiveOnlineRoute(pathname)).toBe(true);
  });

  it("nao classifica o marketplace Tech como rota sensivel de saude", () => {
    expect(isSensitiveOnlineRoute("/dashboard/meus-projetos")).toBe(false);
  });
});
