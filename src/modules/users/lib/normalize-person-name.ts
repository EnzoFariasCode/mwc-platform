const PORTUGUESE_LOCALE = "pt-BR";

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

/**
 * Padrao de nomes da plataforma: texto em minusculas, com apenas a primeira
 * letra do valor em maiuscula. Espacos repetidos tambem sao normalizados.
 */
export function normalizePersonName(value: string | null | undefined) {
  const normalized = normalizeWhitespace(value ?? "").toLocaleLowerCase(
    PORTUGUESE_LOCALE,
  );
  const firstLetterIndex = normalized.search(/\p{L}/u);

  if (firstLetterIndex < 0) return normalized;

  return (
    normalized.slice(0, firstLetterIndex) +
    normalized[firstLetterIndex].toLocaleUpperCase(PORTUGUESE_LOCALE) +
    normalized.slice(firstLetterIndex + 1)
  );
}

export function normalizeOptionalPersonName(
  value: string | null | undefined,
) {
  return normalizePersonName(value) || null;
}
