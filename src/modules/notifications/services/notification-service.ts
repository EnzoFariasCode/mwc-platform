import "server-only";

import { db } from "@/lib/prisma";
import { NotificationType, Prisma } from "@prisma/client";

type NotificationClient = Prisma.TransactionClient | typeof db;

type NotificationInput = {
  userId: string | null | undefined;
  actorId?: string | null;
  type?: NotificationType;
  eventType: string;
  title: string;
  message: string;
  link?: string | null;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
};

export async function upsertNotification(
  input: NotificationInput,
  client: NotificationClient = db,
) {
  if (!input.userId) return null;

  return client.notification.upsert({
    where: {
      userId_entityType_entityId_eventType: {
        userId: input.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        eventType: input.eventType,
      },
    },
    create: {
      userId: input.userId,
      actorId: input.actorId ?? null,
      type: input.type ?? "INFO",
      eventType: input.eventType,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? {},
    },
    update: {
      actorId: input.actorId ?? null,
      type: input.type ?? "INFO",
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      metadata: input.metadata ?? {},
      readAt: null,
    },
  });
}

export async function markNotificationRead({
  userId,
  notificationId,
}: {
  userId: string;
  notificationId: string;
}) {
  await db.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markEntityNotificationsRead({
  userId,
  entityType,
  entityId,
}: {
  userId: string;
  entityType: string;
  entityId: string;
}) {
  await db.notification.updateMany({
    where: {
      userId,
      entityType,
      entityId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}
