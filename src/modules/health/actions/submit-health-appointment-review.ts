"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { revalidatePath } from "next/cache";

const MAX_COMMENT_LENGTH = 1000;

function normalizeComment(comment?: string) {
  const normalized = comment?.trim();
  return normalized ? normalized : null;
}

export async function submitHealthAppointmentReview(
  appointmentId: string,
  rating: number,
  comment?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Voce precisa estar logado para avaliar." };
  }
  if (!appointmentId) {
    return { success: false, error: "Consulta invalida." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: "Escolha uma nota entre 1 e 5." };
  }

  const normalizedComment = normalizeComment(comment);
  if (normalizedComment && normalizedComment.length > MAX_COMMENT_LENGTH) {
    return {
      success: false,
      error: `O comentario deve ter no maximo ${MAX_COMMENT_LENGTH} caracteres.`,
    };
  }

  const rateLimitError = await consumeRateLimit({
    key: `health-review:${session.user.id}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimitError) return { success: false, error: rateLimitError };

  try {
    const review = await db.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          status: true,
          patientId: true,
          professionalId: true,
          professional: {
            select: {
              id: true,
              userType: true,
              industry: true,
              isActive: true,
            },
          },
        },
      });

      if (!appointment || appointment.patientId !== session.user.id) {
        throw new Error("Consulta nao encontrada para este paciente.");
      }
      if (appointment.status !== "COMPLETED") {
        throw new Error("Somente consultas concluidas podem ser avaliadas.");
      }
      if (
        appointment.professional.userType !== "PROFESSIONAL" ||
        appointment.professional.industry !== "HEALTH"
      ) {
        throw new Error("Profissional Online invalido.");
      }

      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "User"
        WHERE "id" = ${appointment.professionalId}
        FOR UPDATE
      `;

      const existing = await tx.healthAppointmentReview.findUnique({
        where: { appointmentId: appointment.id },
        select: { id: true },
      });
      if (existing) {
        throw new Error("Esta consulta ja foi avaliada.");
      }

      const created = await tx.healthAppointmentReview.create({
        data: {
          appointmentId: appointment.id,
          authorId: session.user.id,
          professionalId: appointment.professionalId,
          rating,
          comment: normalizedComment,
        },
        select: { id: true },
      });

      const aggregate = await tx.healthAppointmentReview.aggregate({
        where: {
          professionalId: appointment.professionalId,
          isVisible: true,
        },
        _avg: { rating: true },
        _count: { _all: true },
      });

      await tx.user.update({
        where: { id: appointment.professionalId },
        data: {
          rating: aggregate._avg.rating ?? 0,
          ratingCount: aggregate._count._all,
        },
      });

      return {
        id: created.id,
        professionalId: appointment.professionalId,
      };
    });

    await upsertNotification({
      userId: review.professionalId,
      actorId: session.user.id,
      type: "SUCCESS",
      eventType: "HEALTH_REVIEW_RECEIVED",
      title: "Nova avaliacao recebida",
      message: `Voce recebeu uma avaliacao de ${rating} estrela${rating === 1 ? "" : "s"}.`,
      link: `/agendar-consulta/perfil/${review.professionalId}`,
      entityType: "HEALTH_REVIEW",
      entityId: review.id,
    });

    revalidatePath("/agendar-consulta/historico");
    revalidatePath("/agendar-consulta/dashboard-profissional");
    revalidatePath(`/agendar-consulta/perfil/${review.professionalId}`);
    revalidatePath("/agendar-consulta");

    return { success: true };
  } catch (error) {
    console.error("[HEALTH_REVIEW_SUBMIT_ERROR]", error);

    if (error instanceof Error) {
      const knownMessages = [
        "Consulta nao encontrada",
        "Somente consultas concluidas",
        "Profissional Online invalido",
        "Esta consulta ja foi avaliada",
      ];
      const known = knownMessages.find((message) =>
        error.message.includes(message),
      );
      if (known) return { success: false, error: error.message };
    }

    return {
      success: false,
      error: "Nao foi possivel enviar a avaliacao.",
    };
  }
}
