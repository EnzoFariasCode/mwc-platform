import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const processEmailOutbox = vi.hoisted(() => vi.fn());
const recoverMissingAppointmentConfirmationEmails = vi.hoisted(() => vi.fn());
const operations = vi.hoisted(() => ({
  cleanup: vi.fn(),
  redact: vi.fn(),
  started: vi.fn(),
  succeeded: vi.fn(),
  failed: vi.fn(),
}));

vi.mock("@/modules/email/services/email-outbox-processor", () => ({
  processEmailOutbox,
}));
vi.mock("@/modules/email/services/email-operations-service", () => ({
  cleanupEmailWebhookEventLogs: operations.cleanup,
  redactExpiredEmailOutboxPersonalData: operations.redact,
  markEmailOutboxCronStarted: operations.started,
  markEmailOutboxCronSucceeded: operations.succeeded,
  markEmailOutboxCronFailed: operations.failed,
}));
vi.mock(
  "@/modules/health/services/appointment-confirmation-email-recovery",
  () => ({ recoverMissingAppointmentConfirmationEmails }),
);

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
    recoverMissingAppointmentConfirmationEmails.mockReset();
    recoverMissingAppointmentConfirmationEmails.mockResolvedValue({
      inspected: 0,
      missing: 0,
      repaired: 0,
      failed: 0,
    });
    operations.cleanup.mockReset();
    operations.cleanup.mockResolvedValue(0);
    operations.redact.mockReset();
    operations.redact.mockResolvedValue(0);
    operations.started.mockReset();
    operations.started.mockResolvedValue(undefined);
    operations.succeeded.mockReset();
    operations.succeeded.mockResolvedValue(undefined);
    operations.failed.mockReset();
    operations.failed.mockResolvedValue(undefined);
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
      expect.objectContaining({
        success: true,
        sent: 1,
        inspected: 1,
        purgedWebhookEvents: 0,
        redactedOutboxEntries: 0,
        appointmentConfirmationRecovery: expect.objectContaining({
          repaired: 0,
        }),
      }),
    );
    expect(operations.started).toHaveBeenCalledOnce();
    expect(operations.succeeded).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: expect.objectContaining({
          sent: 1,
          purgedWebhookEvents: 0,
          redactedOutboxEntries: 0,
        }),
      }),
    );
    expect(JSON.stringify(body)).not.toContain("example.com");
  });

  it("registra a falha operacional do processador", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    processEmailOutbox.mockRejectedValue(new Error("temporary failure"));

    const response = await GET(
      new Request("https://example.com/api/cron/email-outbox", {
        headers: { Authorization: "Bearer cron-test-secret" },
      }),
    );

    expect(response.status).toBe(500);
    expect(operations.failed).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });
});
