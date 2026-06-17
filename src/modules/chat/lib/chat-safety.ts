export const CHAT_MAX_CONTENT_LENGTH = 2000;

const CONTACT_PATTERN =
  /(?:\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b)|(?:\+?\d[\d\s().-]{7,}\d)|(?:\b(?:whatsapp|zap|telegram|instagram|insta|discord)\b)|(?:https?:\/\/|www\.)/i;

export function normalizeMessageContent(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isMessageTooLong(value: string) {
  return value.length > CHAT_MAX_CONTENT_LENGTH;
}

export function containsExternalContact(value: string) {
  return CONTACT_PATTERN.test(value);
}

export function canSendExternalContact({
  content,
  hasPaidContext,
}: {
  content: string;
  hasPaidContext: boolean;
}) {
  return !containsExternalContact(content) || hasPaidContext;
}

export function isBroadcastDuplicateLimitReached({
  previousCount,
  limit,
}: {
  previousCount: number;
  limit: number;
}) {
  return previousCount >= limit;
}
