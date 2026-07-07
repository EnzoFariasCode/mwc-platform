export const PROFESSIONAL_CREDENTIAL_TYPES = [
  "CRM",
  "CRP",
  "CRN",
  "CREF",
  "COREN",
  "CRO",
  "CREFITO",
  "CRFA",
  "CRBM",
  "CRMV",
  "RMS",
  "RQE",
  "OAB",
] as const;

export type ProfessionalCredentialType =
  (typeof PROFESSIONAL_CREDENTIAL_TYPES)[number];

const CREDENTIAL_PATTERN = new RegExp(
  `^(${PROFESSIONAL_CREDENTIAL_TYPES.join("|")})\\s*(?:-|/|:)??\\s*(.+)$`,
  "i",
);

export function parseProfessionalCredential(value?: string | null) {
  const raw = value?.trim();

  if (!raw) {
    return {
      type: "CRM" as ProfessionalCredentialType,
      number: "",
      formatted: "",
      hasKnownType: false,
    };
  }

  const match = raw.match(CREDENTIAL_PATTERN);

  if (!match) {
    return {
      type: "CRM" as ProfessionalCredentialType,
      number: raw,
      formatted: `REG - ${raw}`,
      hasKnownType: false,
    };
  }

  const type = match[1].toUpperCase() as ProfessionalCredentialType;
  const number = match[2].trim();

  return {
    type,
    number,
    formatted: `${type} - ${number}`,
    hasKnownType: true,
  };
}

export function formatProfessionalCredential(value?: string | null) {
  return parseProfessionalCredential(value).formatted;
}

export function buildProfessionalCredential(type: string, number: string) {
  const normalizedType = type.trim().toUpperCase();
  const normalizedNumber = number.trim();

  if (!normalizedType || !normalizedNumber) return null;
  if (
    !PROFESSIONAL_CREDENTIAL_TYPES.includes(
      normalizedType as ProfessionalCredentialType,
    )
  ) {
    return null;
  }

  return `${normalizedType} - ${normalizedNumber}`;
}
