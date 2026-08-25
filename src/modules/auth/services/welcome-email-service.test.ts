import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { Prisma } from "@prisma/client";
import { enqueueWelcomeEmail } from "./welcome-email-service";

describe("welcome email outbox", () => {
  it("cria uma mensagem idempotente vinculada ao usuario", async () => {
    const emailOutbox = {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "outbox_1" }),
    };
    const client = {
      emailOutbox,
      emailDeliveryAttempt: {},
    } as unknown as Prisma.TransactionClient;

    const result = await enqueueWelcomeEmail(client, {
      userId: "user_1",
      email: "pessoa@example.com",
      name: "Pessoa",
      userType: "CLIENT",
      industry: "TECH",
    });

    expect(result?.created).toBe(true);
    expect(emailOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        idempotencyKey: "AUTH_WELCOME:user_1",
        eventType: "AUTH_WELCOME",
        templateKey: "auth.welcome",
        recipientUserId: "user_1",
      }),
    });
  });

  it("nao cria envio quando a conta nao possui e-mail", async () => {
    const client = {
      emailOutbox: { create: vi.fn() },
      emailDeliveryAttempt: {},
    } as unknown as Prisma.TransactionClient;

    await expect(
      enqueueWelcomeEmail(client, {
        userId: "user_1",
        email: null,
        name: "Pessoa",
        userType: "CLIENT",
        industry: "TECH",
      }),
    ).resolves.toBeNull();
    expect(client.emailOutbox.create).not.toHaveBeenCalled();
  });
});
