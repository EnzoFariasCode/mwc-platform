import type {
  HealthSpecialty,
  ProfessionalCouncil,
  ProfessionalVerificationDocumentType,
  ProfessionalVerificationStatus,
} from "@prisma/client";

export const PROFESSIONAL_VERIFICATION_PRIVACY_VERSION = "2026-07-16";

const SPECIALTY_COUNCIL: Record<HealthSpecialty, ProfessionalCouncil> = {
  PSYCHOLOGIST: "CRP",
  NUTRITIONIST: "CRN",
  PERSONAL_TRAINER: "CREF",
  LAWYER: "OAB",
  TEACHER: "NOT_APPLICABLE",
};

const SPECIALTY_LABEL: Record<HealthSpecialty, string> = {
  PSYCHOLOGIST: "Psicologia",
  NUTRITIONIST: "Nutricao",
  PERSONAL_TRAINER: "Personal Trainer",
  LAWYER: "Advocacia",
  TEACHER: "Professor",
};

const STATUS_LABEL: Record<ProfessionalVerificationStatus, string> = {
  DRAFT: "Documentos pendentes",
  PENDING: "Aguardando analise",
  UNDER_REVIEW: "Em analise",
  CHANGES_REQUIRED: "Ajustes solicitados",
  APPROVED: "Verificado",
  REJECTED: "Verificacao recusada",
  SUSPENDED: "Verificacao suspensa",
  EXPIRED: "Verificacao expirada",
};

export function expectedCouncilForSpecialty(specialty: HealthSpecialty) {
  return SPECIALTY_COUNCIL[specialty];
}

export function specialtyVerificationLabel(specialty: HealthSpecialty) {
  return SPECIALTY_LABEL[specialty];
}

export function verificationStatusLabel(
  status: ProfessionalVerificationStatus | null | undefined,
) {
  return status ? STATUS_LABEL[status] : STATUS_LABEL.DRAFT;
}

export function requiredVerificationDocuments(
  specialty: HealthSpecialty,
): ProfessionalVerificationDocumentType[] {
  return specialty === "TEACHER"
    ? ["IDENTITY_DOCUMENT", "QUALIFICATION_DOCUMENT"]
    : ["IDENTITY_DOCUMENT", "PROFESSIONAL_CREDENTIAL"];
}

export function canProfessionalEditVerification(
  status: ProfessionalVerificationStatus | null | undefined,
) {
  return !status ||
    ["DRAFT", "CHANGES_REQUIRED", "REJECTED", "EXPIRED"].includes(status);
}

export function isProfessionalVerificationApproved(
  verification:
    | { status?: string | null; expiresAt?: Date | string | null }
    | null
    | undefined,
  now = new Date(),
) {
  if (verification?.status !== "APPROVED") return false;
  if (!verification.expiresAt) return true;
  return new Date(verification.expiresAt).getTime() > now.getTime();
}

export function officialRegistryUrl(specialty: HealthSpecialty) {
  const urls: Record<HealthSpecialty, string | null> = {
    PSYCHOLOGIST: "https://cadastro.cfp.org.br/cfp/",
    NUTRITIONIST:
      "https://cfn.org.br/consulta-nacional-de-nutricionistas/",
    PERSONAL_TRAINER: "https://www.confef.org.br/confef/registrados/",
    LAWYER: "https://consulta.oab.org.br/",
    TEACHER: null,
  };

  return urls[specialty];
}
