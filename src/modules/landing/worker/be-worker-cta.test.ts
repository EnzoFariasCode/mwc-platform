import { describe, expect, it } from "vitest";

import { resolveBeWorkerCta } from "./be-worker-cta";

describe("resolveBeWorkerCta", () => {
  it("leva visitantes ao cadastro com o setor escolhido", () => {
    expect(resolveBeWorkerCta({ isLoggedIn: false }, "tech").href).toBe(
      "/cadastro?tipo=profissional&setor=TECH",
    );
    expect(resolveBeWorkerCta({ isLoggedIn: false }, "online").href).toBe(
      "/cadastro?tipo=profissional&setor=HEALTH",
    );
  });

  it("leva clientes ao fluxo explicito de conversao no proprio painel", () => {
    const context = { isLoggedIn: true, userType: "CLIENT" as const };

    expect(resolveBeWorkerCta(context, "tech").href).toBe(
      "/dashboard/cliente?converter=profissional",
    );
    expect(resolveBeWorkerCta(context, "online").href).toBe(
      "/dashboard/cliente?converter=profissional",
    );
  });

  it("mantem profissionais Tech no setor Tech", () => {
    const context = {
      isLoggedIn: true,
      userType: "PROFESSIONAL" as const,
      industry: "TECH" as const,
    };

    expect(resolveBeWorkerCta(context, "tech").href).toBe(
      "/dashboard/profissional",
    );
    expect(resolveBeWorkerCta(context, "online").href).toBe(
      "/dashboard/profissional",
    );
  });

  it("mantem profissionais Online no painel Online", () => {
    const context = {
      isLoggedIn: true,
      userType: "PROFESSIONAL" as const,
      industry: "HEALTH" as const,
    };

    expect(resolveBeWorkerCta(context, "tech").href).toBe(
      "/agendar-consulta/dashboard-profissional",
    );
    expect(resolveBeWorkerCta(context, "online").href).toBe(
      "/agendar-consulta/dashboard-profissional",
    );
  });

  it("leva administradores somente ao painel administrativo", () => {
    const context = { isLoggedIn: true, userType: "ADMIN" as const };

    expect(resolveBeWorkerCta(context, "primary").href).toBe(
      "/dashboard/admin",
    );
    expect(resolveBeWorkerCta(context, "tech").href).toBe("/dashboard/admin");
  });
});
