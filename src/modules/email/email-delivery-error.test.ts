import { describe, expect, it } from "vitest";

import {
  classifyResendError,
  sanitizeEmailProviderMessage,
} from "./email-delivery-error";

describe("email delivery error classification", () => {
  it("trata indisponibilidade e concorrencia idempotente como temporarias", () => {
    expect(
      classifyResendError({
        name: "internal_server_error",
        statusCode: 503,
        message: "Unavailable",
      }),
    ).toEqual(expect.objectContaining({ retryable: true, category: "PROVIDER" }));
    expect(
      classifyResendError({
        name: "concurrent_idempotent_requests",
        statusCode: 409,
        message: "Concurrent request",
      }),
    ).toEqual(
      expect.objectContaining({ retryable: true, category: "CONCURRENCY" }),
    );
  });

  it("trata credencial e payload invalidos como falhas permanentes", () => {
    expect(
      classifyResendError({
        name: "invalid_api_key",
        statusCode: 401,
        message: "Invalid key",
      }),
    ).toEqual(
      expect.objectContaining({ retryable: false, category: "AUTHENTICATION" }),
    );
    expect(
      classifyResendError({
        name: "invalid_idempotent_request",
        statusCode: 409,
        message: "Payload changed",
      }),
    ).toEqual(
      expect.objectContaining({ retryable: false, category: "VALIDATION" }),
    );
  });

  it("remove e-mail e chave do detalhe persistido", () => {
    expect(
      sanitizeEmailProviderMessage(
        "Failure for cliente@example.com using re_super_secret_key",
      ),
    ).toBe("Failure for [email] using [secret]");
  });
});
