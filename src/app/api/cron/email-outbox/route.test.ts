import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const processEmailOutbox = vi.hoisted(() => vi.fn());

vi.mock("@/modules/email/services/email-outbox-processor", () => ({
  processEmailOutbox,
}));

import { GET } from "./route";

const metrics = {
  inspected: 1,
  claimed: 1,
  sent: 1,
  retryScheduled: 0,
  requiresAttention: 0,
  skipped: 0,
  infrastructureErrors: 0,
  staleInspected: 0,
  staleRecovered: 0,
  staleRequiresAttention: 0,
  durationMs: 10,
};

describe("email outbox cron", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    processEmailOutbox.mockReset();
    processEmailOutbox.mockResolvedValue(metrics);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("recusa chamadas sem o bearer correto", async () => {
    const response = await GET(
      new Request("https://example.com/api/cron/email-outbox"),
    );

    expect(response.status).toBe(401);
    expect(processEmailOutbox).not.toHaveBeenCalled();
  });

  it("falha fechado quando CRON_SECRET nao esta configurado", async () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(
      new Request("https://example.com/api/cron/email-outbox"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: "Agendador nao configurado.",
    });
  });

  it("processa a fila e retorna somente metricas seguras", async () => {
    const response = await GET(
      new Request("https://example.com/api/cron/email-outbox", {
        headers: { Authorization: "Bearer cron-test-secret" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual(
      expect.objectContaining({ success: true, sent: 1, inspected: 1 }),
    );
    expect(JSON.stringify(body)).not.toContain("example.com");
  });
});
