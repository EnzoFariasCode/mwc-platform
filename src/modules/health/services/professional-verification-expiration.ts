import "server-only";

import { db } from "@/lib/prisma";
import { upsertNotification } from "@/modules/notifications/services/notification-service";

export async function expireProfessionalVerifications(now = new Date()) {
  const expired = await db.professionalVerification.findMany({
    where: {
      status: "APPROVED",
      expiresAt: { lte: now },
    },
    select: { id: true, professionalId: true },
  });

  if (expired.length === 0) return { expired: 0 };

  await db.$transaction(async (tx) => {
    await tx.professionalVerification.updateMany({
      where: {
        id: { in: expired.map((item) => item.id) },
        status: "APPROVED",
        expiresAt: { lte: now },
      },
      data: { status: "EXPIRED" },
    });

    await Promise.all(
      expired.map((item) =>
        upsertNotification(
          {
            userId: item.professionalId,
            type: "WARNING",
            eventType: "PROFESSIONAL_VERIFICATION_EXPIRED",
            title: "Verificacao profissional expirada",
            message:
              "Atualize seus documentos para continuar recebendo novos atendimentos.",
            link: "/agendar-consulta/verificacao",
            entityType: "PROFESSIONAL_VERIFICATION",
            entityId: item.id,
          },
          tx,
        ),
      ),
    );
  });

  return { expired: expired.length };
}
