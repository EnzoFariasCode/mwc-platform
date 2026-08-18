export type AccountUserType = "CLIENT" | "PROFESSIONAL" | "ADMIN";
export type ProfessionalIndustry = "TECH" | "HEALTH";

export type AccountIdentity = {
  userType?: AccountUserType | string | null;
  industry?: ProfessionalIndustry | string | null;
};

export const ACCOUNT_DESTINATIONS = {
  admin: "/dashboard/admin",
  client: "/dashboard/cliente",
  portal: "/portal",
  techProfessional: "/dashboard/profissional",
  healthProfessional: "/agendar-consulta/dashboard-profissional",
} as const;

const TECH_PROFESSIONAL_PREFIXES = [
  "/dashboard/encontrar-projetos",
  "/dashboard/minhas-propostas",
  "/dashboard/projetos-ativos",
  "/dashboard/financeiro",
] as const;

const HEALTH_PROFESSIONAL_PREFIXES = [
  "/agendar-consulta/dashboard-profissional",
  "/agendar-consulta/verificacao",
  "/agendar-consulta/prontuarios",
  "/agendar-consulta/prontuario",
  "/agendar-consulta/financeiro",
] as const;

function matchesRoutePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isTechProfessional(identity: AccountIdentity) {
  return (
    identity.userType === "PROFESSIONAL" && identity.industry === "TECH"
  );
}

export function isHealthProfessional(identity: AccountIdentity) {
  return (
    identity.userType === "PROFESSIONAL" && identity.industry === "HEALTH"
  );
}

export function getAccountDashboardPath(identity: AccountIdentity) {
  if (identity.userType === "ADMIN") {
    return ACCOUNT_DESTINATIONS.admin;
  }

  if (isHealthProfessional(identity)) {
    return ACCOUNT_DESTINATIONS.healthProfessional;
  }

  if (isTechProfessional(identity)) {
    return ACCOUNT_DESTINATIONS.techProfessional;
  }

  if (identity.userType === "CLIENT") {
    return ACCOUNT_DESTINATIONS.client;
  }

  return ACCOUNT_DESTINATIONS.portal;
}

export function getPostLoginPath(identity: AccountIdentity) {
  return identity.userType === "CLIENT"
    ? ACCOUNT_DESTINATIONS.portal
    : getAccountDashboardPath(identity);
}

export function getRequiredProfessionalIndustry(
  pathname: string,
): ProfessionalIndustry | null {
  const routePath = pathname.split(/[?#]/, 1)[0];

  // A pagina exata e o painel privado Tech. /dashboard/profissional/[id]
  // continua sendo a vitrine visitavel por clientes autenticados.
  if (
    routePath === ACCOUNT_DESTINATIONS.techProfessional ||
    TECH_PROFESSIONAL_PREFIXES.some((prefix) =>
      matchesRoutePrefix(routePath, prefix),
    )
  ) {
    return "TECH";
  }

  if (
    HEALTH_PROFESSIONAL_PREFIXES.some((prefix) =>
      matchesRoutePrefix(routePath, prefix),
    )
  ) {
    return "HEALTH";
  }

  return null;
}

export function canAccessProfessionalSectorRoute(
  pathname: string,
  identity: AccountIdentity,
) {
  const requiredIndustry = getRequiredProfessionalIndustry(pathname);
  if (!requiredIndustry) return true;

  return (
    identity.userType === "PROFESSIONAL" &&
    identity.industry === requiredIndustry
  );
}

export function getSafeLocalCallbackPath(
  callbackPath: string | null | undefined,
) {
  if (
    !callbackPath ||
    !callbackPath.startsWith("/") ||
    callbackPath.startsWith("//")
  ) {
    return null;
  }

  return callbackPath;
}

export function getAuthorizedCallbackPath(
  callbackPath: string | null | undefined,
  identity: AccountIdentity,
) {
  const safeCallbackPath = getSafeLocalCallbackPath(callbackPath);
  if (!safeCallbackPath) return getPostLoginPath(identity);

  return canAccessProfessionalSectorRoute(safeCallbackPath, identity)
    ? safeCallbackPath
    : getAccountDashboardPath(identity);
}
