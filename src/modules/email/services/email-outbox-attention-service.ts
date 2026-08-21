import "server-only";

import { db } from "@/lib/prisma";
import { upsertNotification } from "@/modules/notifications/services/notification-service";

export async function notifyAdminsAboutEmailOutboxAttention(email: {
  id: string;
  eventType: string;
}) {
  const admins = await db.user.findMany({
    where: { userType: "ADMIN", isActive: true },
    select: { id: true },
  });

  const results = await Promise.allSettled(
    admins.map((admin) =>
      upsertNotification({
        userId: admin.id,
        type: "WARNING",
        eventType: "EMAIL_OUTBOX_REQUIRES_ATTENTION",
        title: "E-mail exige atencao",
        message: `Um envio do evento ${email.eventType} esgotou o processamento automatico.`,
        link: "/dashboard/admin",
        entityType: "EMAIL_OUTBOX",
        entityId: email.id,
      }),
    ),
  );
  const failed = results.filter((result) => result.status === "rejected").length;

  if (failed > 0) {
    console.error("[EMAIL_OUTBOX_ADMIN_NOTIFICATION_FAILED]", {
      outboxId: email.id,
      recipientCount: admins.length,
      failed,
    });
  }

  return { recipientCount: admins.length, failed };
}
