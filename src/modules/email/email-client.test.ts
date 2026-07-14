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

    expect(result).toEqual({
      success: false,
      error: "Erro ao enviar e-mail.",
    });
    expect(errorSpy).toHaveBeenCalledWith("[WELCOME_EMAIL_ERROR]", {
      name: "validation_error",
      statusCode: 403,
      message: "Domain is not verified",
    });
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
