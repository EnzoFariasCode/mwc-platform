import "server-only";

import { db } from "@/lib/prisma";
import {
  enqueueTransactionalEmail,
  type EmailOutboxDatabaseClient,
} from "@/modules/email/services/email-outbox-service";

type WelcomeEmailInput = {
  userId: string;
  email: string | null;
  name: string | null;
  userType: "CLIENT" | "PROFESSIONAL" | "ADMIN";
  industry: "TECH" | "HEALTH";
};

export async function enqueueWelcomeEmail(
  client: EmailOutboxDatabaseClient,
  input: WelcomeEmailInput,
) {
  if (!input.email) return null;

  return enqueueTransactionalEmail(client, {
    idempotencyKey: `AUTH_WELCOME:${input.userId}`,
    eventType: "AUTH_WELCOME",
    templateKey: "auth.welcome",
    templateVersion: 1,
    recipientUserId: input.userId,
    recipientEmail: input.email,
    recipientName: input.name,
    entityType: "USER_ACCOUNT",
    entityId: input.userId,
    priority: 60,
    payload: {
      name: input.name,
      userType: input.userType,
      industry: input.industry,
    },
  });
}

export async function sendWelcomeEmail({
  userId,
  email,
  name,
  userType,
  industry,
}: WelcomeEmailInput) {
  return enqueueWelcomeEmail(db, {
    userId,
    email,
    name,
    userType,
    industry,
  });
}
