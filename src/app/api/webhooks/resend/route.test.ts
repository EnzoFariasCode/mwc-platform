import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ verify: vi.fn(), process: vi.fn() }));

vi.mock("@/modules/email/email-client", () => ({
  verifyResendWebhook: mocks.verify,
}));
vi.mock("@/modules/email/services/resend-webhook-service", () => ({
  processResendWebhookEvent: mocks.process,
}));

import { POST } from "./route";

function request(body = '{"type":"email.delivered"}') {
  return new Request("https://www.maximusworldclick.com.br/api/webhooks/resend", {
    method: "POST",
    body,
    headers: {
      "svix-id": "event_1",
      "svix-timestamp": "1787673600",
      "svix-signature": "v1,signature",
    },
  });
}

describe("POST /api/webhooks/resend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_WEBHOOK_SECRET = "whsec_test";
    mocks.verify.mockReturnValue({
      type: "email.delivered",
      created_at: "2026-08-25T16:00:00.000Z",
      data: { email_id: "resend_1" },
    });
    mocks.process.mockResolvedValue({ status: "PROCESSED" });
  });

  it("verifica o corpo bruto e processa evento autenticado", async () => {
    const rawBody = '{"type":"email.delivered","exact":true}';
    const response = await POST(request(rawBody));

    expect(response.status).toBe(200);
    expect(mocks.verify).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: rawBody,
        id: "event_1",
        webhookSecret: "whsec_test",
      }),
    );
    expect(mocks.process).toHaveBeenCalledOnce();
  });

  it("rejeita assinatura invalida antes de acessar o banco", async () => {
    mocks.verify.mockImplementation(() => { throw new Error("Invalid signature"); });
    const response = await POST(request());

    expect(response.status).toBe(400);
    expect(mocks.process).not.toHaveBeenCalled();
  });

  it("falha de forma explicita quando o segredo nao esta configurado", async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;
    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it("pede novo envio ao provedor quando o evento ainda esta em processamento", async () => {
    mocks.process.mockResolvedValue({ status: "BUSY" });

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("30");
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      status: "BUSY",
    });
  });
});
