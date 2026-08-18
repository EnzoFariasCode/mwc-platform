import { describe, expect, it } from "vitest";

import {
  canAccessProfessionalSectorRoute,
  getAccountDashboardPath,
  getAuthorizedCallbackPath,
  getPostLoginPath,
  getRequiredProfessionalIndustry,
  getSafeLocalCallbackPath,
} from "./account-access";

describe("account access", () => {
  const techProfessional = {
    userType: "PROFESSIONAL" as const,
    industry: "TECH" as const,
  };
  const healthProfessional = {
    userType: "PROFESSIONAL" as const,
    industry: "HEALTH" as const,
  };

  it("resolve um unico dashboard para cada tipo de conta", () => {
    expect(getAccountDashboardPath(techProfessional)).toBe(
      "/dashboard/profissional",
    );
    expect(getAccountDashboardPath(healthProfessional)).toBe(
      "/agendar-consulta/dashboard-profissional",
    );
    expect(getAccountDashboardPath({ userType: "ADMIN" })).toBe(
      "/dashboard/admin",
    );
    expect(getAccountDashboardPath({ userType: "CLIENT" })).toBe(
      "/dashboard/cliente",
    );
  });

  it("mantem o portal como entrada pos-login de clientes", () => {
    expect(getPostLoginPath({ userType: "CLIENT" })).toBe("/portal");
    expect(getPostLoginPath(healthProfessional)).toBe(
      "/agendar-consulta/dashboard-profissional",
    );
  });

  it("classifica as rotas profissionais privadas sem bloquear vitrines", () => {
    expect(getRequiredProfessionalIndustry("/dashboard/profissional")).toBe(
      "TECH",
    );
    expect(
      getRequiredProfessionalIndustry("/dashboard/encontrar-projetos/abc"),
    ).toBe("TECH");
    expect(
      getRequiredProfessionalIndustry("/agendar-consulta/prontuario/abc"),
    ).toBe("HEALTH");
    expect(
      getRequiredProfessionalIndustry("/dashboard/profissional/abc"),
    ).toBeNull();
    expect(getRequiredProfessionalIndustry("/dashboard/cliente")).toBeNull();
    expect(
      getRequiredProfessionalIndustry(
        "/dashboard/profissional?openPlans=true",
      ),
    ).toBe("TECH");
  });

  it("impede acesso cruzado entre Tech e Online", () => {
    expect(
      canAccessProfessionalSectorRoute(
        "/dashboard/minhas-propostas",
        techProfessional,
      ),
    ).toBe(true);
    expect(
      canAccessProfessionalSectorRoute(
        "/dashboard/minhas-propostas",
        healthProfessional,
      ),
    ).toBe(false);
    expect(
      canAccessProfessionalSectorRoute(
        "/agendar-consulta/dashboard-profissional",
        healthProfessional,
      ),
    ).toBe(true);
    expect(
      canAccessProfessionalSectorRoute(
        "/agendar-consulta/dashboard-profissional",
        techProfessional,
      ),
    ).toBe(false);
  });

  it("nao autoriza clientes ou administradores em paineis profissionais", () => {
    expect(
      canAccessProfessionalSectorRoute("/dashboard/financeiro", {
        userType: "CLIENT",
      }),
    ).toBe(false);
    expect(
      canAccessProfessionalSectorRoute(
        "/agendar-consulta/verificacao",
        { userType: "ADMIN" },
      ),
    ).toBe(false);
  });

  it("ignora callbacks externos e callbacks de outro setor", () => {
    expect(getSafeLocalCallbackPath("//example.com/path")).toBeNull();
    expect(
      getAuthorizedCallbackPath("https://example.com", healthProfessional),
    ).toBe("/agendar-consulta/dashboard-profissional");
    expect(
      getAuthorizedCallbackPath(
        "/dashboard/encontrar-projetos/abc",
        healthProfessional,
      ),
    ).toBe("/agendar-consulta/dashboard-profissional");
    expect(
      getAuthorizedCallbackPath("/dashboard/chat?newChat=abc", healthProfessional),
    ).toBe("/dashboard/chat?newChat=abc");
  });
});
