export const GENERAL_TERMS_VERSION = "general-v1.0";

export const TECH_CONTRACT_TERMS = {
  version: "tech-contract-v1.1",
  label: "Termos de Contratacao de Projetos Tech",
  href: "/termos/tech/contratacao",
} as const;

export const PROFESSIONAL_TERMS = {
  TECH: {
    version: "tech-professional-v1.1",
    label: "Termos profissionais do Marketplace Tech",
    href: "/termos/tech",
  },
  HEALTH: {
    version: "online-professional-v1.0",
    label: "Termos profissionais do MWC Online",
    href: "/termos/online",
  },
} as const;

export type ProfessionalTermsIndustry = keyof typeof PROFESSIONAL_TERMS;

export function getProfessionalTerms(industry: ProfessionalTermsIndustry) {
  return PROFESSIONAL_TERMS[industry];
}
