import type {
  HealthSpecialty,
  ProfessionalCouncil,
  ProfessionalRegistryCheckResult,
  ProfessionalVerificationDocumentType,
} from "@prisma/client";
import {
  expectedCouncilForSpecialty,
  requiredVerificationDocuments,
} from "./professional-verification-policy";

export function validateProfessionalVerificationApproval({
  specialty,
  council,
  registrationNumber,
  registrationRegion,
  qualificationTitle,
  documentTypes,
  checkResult,
  sourceUrl,
}: {
  specialty: HealthSpecialty;
  council: ProfessionalCouncil;
  registrationNumber: string | null;
  registrationRegion: string | null;
  qualificationTitle: string | null;
  documentTypes: ProfessionalVerificationDocumentType[];
  checkResult: ProfessionalRegistryCheckResult | null;
  sourceUrl: string | null;
}) {
  const uploaded = new Set(documentTypes);
  if (
    requiredVerificationDocuments(specialty).some(
      (type) => !uploaded.has(type),
    )
  ) {
    return "Nao e possivel aprovar sem todos os documentos.";
  }

  if (council !== expectedCouncilForSpecialty(specialty)) {
    return "Conselho incompativel com a categoria profissional.";
  }

  const isTeacher = specialty === "TEACHER";
  if (isTeacher) {
    if (!qualificationTitle?.trim()) {
      return "A formacao ou certificacao do professor nao foi informada.";
    }
    if (checkResult !== "NOT_APPLICABLE") {
      return "Para professor, o resultado da consulta deve ser Nao se aplica.";
    }
    return null;
  }

  if (!registrationNumber?.trim() || !registrationRegion?.trim()) {
    return "Os dados do registro profissional estao incompletos.";
  }
  if (checkResult !== "ACTIVE") {
    return "Somente registro ativo pode ser aprovado.";
  }

  try {
    if (!sourceUrl || new URL(sourceUrl).protocol !== "https:") throw new Error();
  } catch {
    return "Informe a URL HTTPS oficial utilizada na consulta.";
  }

  return null;
}
