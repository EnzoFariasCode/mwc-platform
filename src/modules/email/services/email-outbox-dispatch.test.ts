import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  processEmailOutbox: vi.fn(),
}));

vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("server-only", () => ({}));
vi.mock("./email-outbox-processor", () => ({
  processEmailOutbox: mocks.processEmailOutbox,
}));

import { scheduleEmailOutboxDispatch } from "./email-outbox-dispatch";

describe("email outbox post-response dispatch", () => {
  beforeEach(() => {
    mocks.after.mockReset();
    mocks.processEmailOutbox.mockReset();
    mocks.processEmailOutbox.mockResolvedValue({ sent: 1 });
  });

  it("processa a fila depois que a resposta termina", async () => {
    let callback: (() => Promise<void>) | undefined;
    mocks.after.mockImplementation((registered) => {
      callback = registered;
    });

    expect(scheduleEmailOutboxDispatch()).toBe(true);
    expect(mocks.processEmailOutbox).not.toHaveBeenCalled();

    await callback?.();

    expect(mocks.processEmailOutbox).toHaveBeenCalledWith({
      batchSize: 25,
      concurrency: 5,
    });
  });

  it("mantem o cron como fallback fora de um ciclo HTTP", () => {
    mocks.after.mockImplementation(() => {
      throw new Error("outside request scope");
    });

    expect(scheduleEmailOutboxDispatch()).toBe(false);
    expect(mocks.processEmailOutbox).not.toHaveBeenCalled();
  });
});
