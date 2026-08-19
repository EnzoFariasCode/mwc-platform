export const CHAT_REPORT_DESCRIPTION_MIN_LENGTH = 20;
export const CHAT_REPORT_DESCRIPTION_MAX_LENGTH = 3_000;

export const CHAT_REPORT_REASONS = [
  "HARASSMENT",
  "FRAUD",
  "SPAM",
  "EXTERNAL_PAYMENT",
  "INAPPROPRIATE_CONTENT",
  "THREAT",
  "OTHER",
] as const;

export type ChatReportReasonValue = (typeof CHAT_REPORT_REASONS)[number];

export function isChatReportReason(
  value: unknown,
): value is ChatReportReasonValue {
  return (
    typeof value === "string" &&
    CHAT_REPORT_REASONS.includes(value as ChatReportReasonValue)
  );
}

export function normalizeChatReportDescription(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}
