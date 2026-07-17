export const ADMIN_DECISION_REASON_MIN_LENGTH = 10;
export const ADMIN_DECISION_REASON_MAX_LENGTH = 2_000;

export type AdminDecisionReasonResult =
  | { success: true; value: string }
  | { success: false; error: string };

export function validateAdminDecisionReason(
  reason?: unknown,
): AdminDecisionReasonResult {
  const normalized =
    typeof reason === "string" ? reason.trim().replace(/\s+/g, " ") : "";

  if (normalized.length < ADMIN_DECISION_REASON_MIN_LENGTH) {
    return {
      success: false,
      error: `Informe uma justificativa com pelo menos ${ADMIN_DECISION_REASON_MIN_LENGTH} caracteres.`,
    };
  }

  if (normalized.length > ADMIN_DECISION_REASON_MAX_LENGTH) {
    return {
      success: false,
      error: `A justificativa deve ter no maximo ${ADMIN_DECISION_REASON_MAX_LENGTH} caracteres.`,
    };
  }

  return { success: true, value: normalized };
}
