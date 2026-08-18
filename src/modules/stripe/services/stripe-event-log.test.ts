import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.hoisted(() => vi.fn());
const updateMany = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  db: {
    stripeEventLog: { findUnique, updateMany, create, update },
  },
}));

import {
  claimStripeEvent,
  markStripeEventFailed,
  markStripeEventProcessed,
} from "./stripe-event-log";

const event = { id: "evt_1", type: "checkout.session.completed" } as const;

describe("Stripe event log", () => {
  beforeEach(() => vi.clearAllMocks());

  it("claims and persists a new event before processing", async () => {
    findUnique.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({ id: "log_1" });

    await expect(claimStripeEvent(event)).resolves.toBe("CLAIMED");
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        stripeEventId: event.id,
        type: event.type,
        status: "PROCESSING",
        attempts: 1,
      }),
    });
  });

  it("does not process an event that was already completed", async () => {
    findUnique.mockResolvedValueOnce({ id: "log_1", status: "PROCESSED" });
    await expect(claimStripeEvent(event)).resolves.toBe("PROCESSED");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("returns busy while another delivery owns the processing lease", async () => {
    findUnique
      .mockResolvedValueOnce({ id: "log_1", status: "PROCESSING" })
      .mockResolvedValueOnce({ status: "PROCESSING" });
    updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(claimStripeEvent(event)).resolves.toBe("BUSY");
  });

  it("clears the processing lease when completing or failing", async () => {
    update.mockResolvedValue({ id: "log_1" });

    await markStripeEventProcessed(event);
    await markStripeEventFailed(event, "provider error");

    expect(update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PROCESSED",
          processingStartedAt: null,
        }),
      }),
    );
    expect(update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          lastError: "provider error",
          processingStartedAt: null,
        }),
      }),
    );
  });
});
