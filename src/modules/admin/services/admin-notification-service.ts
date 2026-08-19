import "server-only";

import { db } from "@/lib/prisma";
import { sendEmail } from "@/modules/email/email-client";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import type { NotificationType } from "@prisma/client";
import {
  normalizeAdminRole,
  type AdminRole,
} from "@/modules/admin/lib/admin-permissions";

type AdminNotificationResult = {
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
};

export async function sendAdminNotification({
  subject,
  lines,
  actionUrl,
  roles = ["OWNER", "FINANCE", "SUPPORT"],
  notification,
}: {
  subject: string;
  lines: Array<string | null | undefined>;
  actionUrl?: string | null;
  roles?: AdminRole[];
  notification?: {
    eventType: string;
    entityType: string;
    entityId: string;
    title?: string;
    message?: string;
    type?: NotificationType;
  };
}): Promise<AdminNotificationResult> {
  const admins = await db.user
    .findMany({
      where: {
        userType: "ADMIN",
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        adminRole: true,
      },
    })
    .catch((error) => {
      console.error("[ADMIN_NOTIFICATION_RECIPIENT_LOOKUP_FAILED]", error);
      return [];
    });
  const recipients = admins.filter((admin) =>
      roles.includes(
        normalizeAdminRole({
          userType: "ADMIN",
          adminRole: admin.adminRole,
        })!,
      ),
    );

  if (recipients.length === 0) {
    console.warn("[ADMIN_NOTIFICATION_NO_RECIPIENTS]", { subject, roles });
    return { recipientCount: 0, deliveredCount: 0, failedCount: 0 };
  }

  const text = [
    ...lines.filter((line): line is string => Boolean(line)),
    actionUrl ? `Abrir no painel: ${actionUrl}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");

  if (notification) {
    const notificationResults = await Promise.allSettled(
      recipients.map((admin) =>
        upsertNotification({
          userId: admin.id,
          type: notification.type ?? "WARNING",
          eventType: notification.eventType,
          title: notification.title ?? subject,
          message:
            notification.message ??
            lines.find((line): line is string => Boolean(line)) ??
            subject,
          link: actionUrl ?? null,
          entityType: notification.entityType,
          entityId: notification.entityId,
        }),
      ),
    );
    const notificationFailures = notificationResults.filter(
      (result) => result.status === "rejected",
    ).length;
    if (notificationFailures > 0) {
      console.error("[ADMIN_IN_APP_NOTIFICATION_FAILED]", {
        subject,
        notificationFailures,
      });
    }
  }

  const results = await Promise.all(
    recipients.map((admin) =>
      sendEmail({
        to: admin.email,
        subject,
        text,
        logPrefix: "ADMIN_NOTIFICATION",
      }),
    ),
  );
  const deliveredCount = results.filter((result) => result.success).length;
  const failedCount = results.length - deliveredCount;

  if (failedCount > 0) {
    console.error("[ADMIN_NOTIFICATION_DELIVERY_FAILED]", {
      subject,
      recipientCount: recipients.length,
      failedCount,
    });
  }

  return {
    recipientCount: recipients.length,
    deliveredCount,
    failedCount,
  };
}
