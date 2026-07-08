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
  `^(${PROFESSIONAL_CREDENTIAL_TYPES.join("|")})\\s*(?:-|/|:)?\\s*(.+)$`,
  "i",
);

function normalizeCredentialNumber(value: string) {
  return value.trim().replace(/^[-/:]\s*/, "").trim();
}

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
    const number = normalizeCredentialNumber(raw);

    return {
      type: "CRM" as ProfessionalCredentialType,
      number,
      formatted: `REG - ${number}`,
      hasKnownType: false,
    };
  }

  const type = match[1].toUpperCase() as ProfessionalCredentialType;
  const number = normalizeCredentialNumber(match[2]);

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
  const normalizedNumber = normalizeCredentialNumber(number);

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
