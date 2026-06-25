const DEFAULT_LOCALE = "pt-BR";
const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

type DateInput = Date | string | number | null | undefined;

function toValidDate(value: DateInput) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateBR(value: DateInput, fallback = "Nao informado") {
  const date = toValidDate(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIME_ZONE,
  }).format(date);
}

export function formatDateTimeBR(
  value: DateInput,
  fallback = "Nao informado",
) {
  const date = toValidDate(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: DEFAULT_TIME_ZONE,
  }).format(date);
}

export function formatCurrencyBR(
  amount: number | null | undefined,
  fallback = "Nao informado",
) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return fallback;
  }

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}
