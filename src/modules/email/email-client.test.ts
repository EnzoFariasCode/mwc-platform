import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { resendSendMock } = vi.hoisted(() => ({
  resendSendMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("resend", () => ({
  Resend: class ResendMock {
    emails = { send: resendSendMock };
  },
}));

async function loadEmailClient() {
  vi.resetModules();
  return import("./email-client");
}

describe("sendEmail", () => {
  beforeEach(() => {
    resendSendMock.mockReset();
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("RESEND_FROM_EMAIL", "MWC <no-reply@mwc.test>");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("retorna o id quando a Resend aceita o e-mail", async () => {
    resendSendMock.mockResolvedValue({
      data: { id: "email_123" },
      error: null,
    });
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const { sendEmail } = await loadEmailClient();

    const result = await sendEmail({
      to: "cliente@example.com",
      subject: "Bem-vindo",
      text: "Conta criada.",
      logPrefix: "WELCOME_EMAIL",
    });

    expect(result).toEqual({ success: true, id: "email_123" });
    expect(resendSendMock).toHaveBeenCalledOnce();
    expect(infoSpy).toHaveBeenCalledWith("[WELCOME_EMAIL_SENT]", {
      id: "email_123",
      recipientCount: 1,
    });
  });

  it("encaminha anexos para a Resend", async () => {
    resendSendMock.mockResolvedValue({
      data: { id: "email_with_attachment" },
      error: null,
    });
    vi.spyOn(console, "info").mockImplementation(() => {});
    const { sendEmail } = await loadEmailClient();
    const content = Buffer.from("receipt");

    await sendEmail({
      to: "profissional@example.com",
      subject: "Saque pago",
      text: "Comprovante anexado.",
      attachments: [
        {
          content,
          filename: "comprovante.pdf",
          contentType: "application/pdf",
        },
      ],
    });

    expect(resendSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          {
            content,
            filename: "comprovante.pdf",
            content_type: "application/pdf",
          },
        ],
      }),
    );
  });

  it("encaminha a chave de idempotencia em requisicoes da outbox", async () => {
    resendSendMock.mockResolvedValue({
      data: { id: "email_idempotent" },
      error: null,
    });
    vi.spyOn(console, "info").mockImplementation(() => {});
    const { sendEmail } = await loadEmailClient();

    await sendEmail({
      to: "cliente@example.com",
      subject: "Bem-vindo",
      text: "Conta criada.",
      idempotencyKey: "WELCOME_EMAIL:user_123",
    });

    expect(resendSendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: ["cliente@example.com"] }),
      { idempotencyKey: "WELCOME_EMAIL:user_123" },
    );
  });

  it("propaga erros retornados pela API da Resend", async () => {
    resendSendMock.mockResolvedValue({
      data: null,
      error: {
        name: "validation_error",
        statusCode: 403,
        message: "Domain is not verified",
      },
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendEmail } = await loadEmailClient();

    const result = await sendEmail({
      to: "cliente@example.com",
      subject: "Bem-vindo",
      text: "Conta criada.",
      logPrefix: "WELCOME_EMAIL",
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: "Erro ao enviar e-mail.",
        errorCode: "validation_error",
        errorCategory: "VALIDATION",
        statusCode: 403,
        retryable: false,
      }),
    );
    expect(errorSpy).toHaveBeenCalledWith("[WELCOME_EMAIL_ERROR]", {
      code: "validation_error",
      category: "VALIDATION",
      statusCode: 403,
      retryable: false,
    });
  });

  it("classifica limite do provedor como falha temporaria", async () => {
    resendSendMock.mockResolvedValue({
      data: null,
      error: {
        name: "rate_limit_exceeded",
        statusCode: 429,
        message: "Rate limit for cliente@example.com",
      },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendEmail } = await loadEmailClient();

    const result = await sendEmail({
      to: "cliente@example.com",
      subject: "Teste",
      text: "Teste.",
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: "rate_limit_exceeded",
        errorCategory: "RATE_LIMIT",
        retryable: true,
        detail: "Rate limit for [email]",
      }),
    );
  });

  it("falha de forma rastreavel quando a configuracao esta ausente", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("RESEND_FROM_EMAIL", "");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendEmail } = await loadEmailClient();

    const result = await sendEmail({
      to: "cliente@example.com",
      subject: "Bem-vindo",
      text: "Conta criada.",
      logPrefix: "WELCOME_EMAIL",
    });

    expect(result.success).toBe(false);
    expect(resendSendMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith("[WELCOME_EMAIL_CONFIG_ERROR]", {
      hasApiKey: false,
      hasFrom: false,
    });
  });
});
