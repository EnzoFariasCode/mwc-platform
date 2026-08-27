const SAFE_REASON_CATEGORIES = new Map(
  [
    "Nao poderei comparecer",
    "Horario nao atende mais",
    "Escolhi outro profissional",
    "Outro motivo",
    "Indisponibilidade profissional",
    "Emergencia ou imprevisto",
    "Conflito de agenda",
    "Profissional nao compareceu",
    "Problema no link do atendimento",
    "Atendimento nao foi realizado",
    "Outro problema",
    "Cliente nao entrou na sala",
    "Cliente nao respondeu ao contato",
    "Atraso excedeu a tolerancia",
  ].map((label) => [normalize(label), label]),
);

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Extracts only a controlled operational category from a reason entered as
 * "Category: free text". The free-text portion must never leave the
 * authenticated health domain through e-mail.
 */
export function healthReasonCategoryForEmail(reason?: string | null) {
  if (!reason) return null;

  const separatorIndex = reason.indexOf(":");
  const candidate = (
    separatorIndex >= 0 ? reason.slice(0, separatorIndex) : reason
  ).trim();

  return SAFE_REASON_CATEGORIES.get(normalize(candidate)) ?? null;
}

export function healthReasonEmailLine(reason?: string | null) {
  const category = healthReasonCategoryForEmail(reason);
  return category
    ? `Categoria informada: ${category}.`
    : "O motivo foi registrado com seguranca na plataforma.";
}
