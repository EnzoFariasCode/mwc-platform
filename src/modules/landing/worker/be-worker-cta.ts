export type BeWorkerUserType = "CLIENT" | "PROFESSIONAL" | "ADMIN";
export type BeWorkerIndustry = "TECH" | "HEALTH";
export type BeWorkerCtaIntent = "primary" | "tech" | "online";

export interface BeWorkerCtaContext {
  isLoggedIn: boolean;
  userType?: BeWorkerUserType | null;
  industry?: BeWorkerIndustry | null;
}

export interface BeWorkerCta {
  text: string;
  href: string;
}

const destinations = {
  admin: ACCOUNT_DESTINATIONS.admin,
  clientConversion: "/dashboard/cliente?converter=profissional",
  techDashboard: ACCOUNT_DESTINATIONS.techProfessional,
  onlineDashboard: ACCOUNT_DESTINATIONS.healthProfessional,
} as const;

export function resolveBeWorkerCta(
  context: BeWorkerCtaContext,
  intent: BeWorkerCtaIntent,
): BeWorkerCta {
  if (!context.isLoggedIn) {
    if (intent === "primary") {
      return { text: "Escolher modalidade", href: "#modalidades" };
    }

    return intent === "tech"
      ? {
          text: "Quero atuar no Tech",
          href: "/cadastro?tipo=profissional&setor=TECH",
        }
      : {
          text: "Quero atender Online",
          href: "/cadastro?tipo=profissional&setor=HEALTH",
        };
  }

  if (context.userType === "ADMIN") {
    return { text: "Ir ao painel Admin", href: destinations.admin };
  }

  if (context.userType === "CLIENT") {
    return {
      text: "Ativar perfil profissional",
      href: destinations.clientConversion,
    };
  }

  if (context.userType === "PROFESSIONAL" && context.industry === "HEALTH") {
    return {
      text: "Acessar painel Online",
      href: destinations.onlineDashboard,
    };
  }

  return {
    text: intent === "tech" ? "Acessar painel Tech" : "Acessar meu painel Tech",
    href: destinations.techDashboard,
  };
}
import { ACCOUNT_DESTINATIONS } from "@/modules/auth/lib/account-access";
