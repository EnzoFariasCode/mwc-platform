import "server-only";

import { db } from "@/lib/prisma";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { canAdminAccessEmailMetadata } from "@/modules/admin/lib/admin-email-access";

export async function notifyAdminsAboutEmailOutboxAttention(email: {
  id: string;
  eventType: string;
  entityType?: string | null;
}) {
  const admins = await db.user.findMany({
    where: { userType: "ADMIN", isActive: true },
    select: { id: true, adminRole: true },
  });
  const authorizedAdmins = admins.filter((admin) =>
    canAdminAccessEmailMetadata(admin.adminRole, {
      eventType: email.eventType,
      entityType: email.entityType ?? null,
    }),
  );

  const results = await Promise.allSettled(
    authorizedAdmins.map((admin) =>
      upsertNotification({
        userId: admin.id,
        type: "WARNING",
        eventType: "EMAIL_OUTBOX_REQUIRES_ATTENTION",
        title: "E-mail exige atencao",
        message: `Um envio do evento ${email.eventType} falhou ou exige analise administrativa.`,
        link: `/dashboard/admin/emails/${email.id}`,
        entityType: "EMAIL_OUTBOX",
        entityId: email.id,
      }),
    ),
  );
  const failed = results.filter((result) => result.status === "rejected").length;

  if (failed > 0) {
    console.error("[EMAIL_OUTBOX_ADMIN_NOTIFICATION_FAILED]", {
      outboxId: email.id,
      recipientCount: authorizedAdmins.length,
      failed,
    });
  }

  return { recipientCount: authorizedAdmins.length, failed };
}
