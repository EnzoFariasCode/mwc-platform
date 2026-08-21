import type { ErrorResponse } from "resend";

export type EmailDeliveryErrorCategory =
  | "CONFIGURATION"
  | "AUTHENTICATION"
  | "VALIDATION"
  | "RATE_LIMIT"
  | "QUOTA"
  | "CONCURRENCY"
  | "PROVIDER"
  | "NETWORK"
  | "UNKNOWN";

export type ClassifiedEmailDeliveryError = {
  code: string;
  category: EmailDeliveryErrorCategory;
  statusCode: number | null;
  retryable: boolean;
  safeMessage: string;
};

const TRANSIENT_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const RESEND_KEY_PATTERN = /\bre_[A-Za-z0-9_-]+\b/g;

export function sanitizeEmailProviderMessage(value: unknown) {
  const message =
    typeof value === "string" && value.trim()
      ? value.trim()
      : "O provedor de e-mail retornou uma falha sem detalhes.";

  return message
    .replace(EMAIL_PATTERN, "[email]")
    .replace(RESEND_KEY_PATTERN, "[secret]")
    .slice(0, 4_000);
}

export function classifyResendError(
  error: Pick<ErrorResponse, "name" | "statusCode" | "message">,
): ClassifiedEmailDeliveryError {
  const code = error.name || "RESEND_UNKNOWN_ERROR";
  const statusCode = error.statusCode ?? null;
  const safeMessage = sanitizeEmailProviderMessage(error.message);

  if (code === "concurrent_idempotent_requests") {
    return {
      code,
      category: "CONCURRENCY",
      statusCode,
      retryable: true,
      safeMessage,
    };
  }

  if (code === "rate_limit_exceeded" || statusCode === 429) {
    return {
      code,
      category: "RATE_LIMIT",
      statusCode,
      retryable: true,
      safeMessage,
    };
  }

  if (code === "internal_server_error" || code === "application_error") {
    return {
      code,
      category: "PROVIDER",
      statusCode,
      retryable: true,
      safeMessage,
    };
  }

  if (statusCode !== null && TRANSIENT_STATUS_CODES.has(statusCode)) {
    return {
      code,
      category: "PROVIDER",
      statusCode,
      retryable: true,
      safeMessage,
    };
  }

  if (
    code === "missing_api_key" ||
    code === "invalid_api_key" ||
    code === "restricted_api_key" ||
    code === "invalid_access" ||
    code === "security_error"
  ) {
    return {
      code,
      category: "AUTHENTICATION",
      statusCode,
      retryable: false,
      safeMessage,
    };
  }

  if (code === "monthly_quota_exceeded" || code === "daily_quota_exceeded") {
    return {
      code,
      category: "QUOTA",
      statusCode,
      retryable: false,
      safeMessage,
    };
  }

  if (
    code === "invalid_idempotency_key" ||
    code === "invalid_idempotent_request" ||
    code === "validation_error" ||
    code === "invalid_attachment" ||
    code === "invalid_from_address" ||
    code === "invalid_parameter" ||
    code === "invalid_region" ||
    code === "missing_required_field" ||
    code === "not_found" ||
    code === "method_not_allowed"
  ) {
    return {
      code,
      category: "VALIDATION",
      statusCode,
      retryable: false,
      safeMessage,
    };
  }

  return {
    code,
    category: "UNKNOWN",
    statusCode,
    retryable: false,
    safeMessage,
  };
}

export function classifyEmailException(
  error: unknown,
): ClassifiedEmailDeliveryError {
  return {
    code: "EMAIL_NETWORK_ERROR",
    category: "NETWORK",
    statusCode: null,
    retryable: true,
    safeMessage: sanitizeEmailProviderMessage(
      error instanceof Error ? error.message : error,
    ),
  };
}
