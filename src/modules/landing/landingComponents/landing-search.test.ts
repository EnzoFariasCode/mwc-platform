import { describe, expect, it } from "vitest";

import { resolveLandingSearchUrl } from "./landing-search";

describe("resolveLandingSearchUrl", () => {
  it.each(["Advogado", "advogada", "Advocacia", " ADVOGADO(A) "])(
    "direciona %s exclusivamente ao MWC Online",
    (term) => {
      expect(resolveLandingSearchUrl(term, "Sao Paulo")).toBe(
        "/agendar-consulta/advocacia",
      );
    },
  );

  it("mantem as demais categorias no Marketplace Tech", () => {
    expect(resolveLandingSearchUrl("Web Designer", "Curitiba")).toBe(
      "/search?q=Web+Designer&local=Curitiba",
    );
  });
});
