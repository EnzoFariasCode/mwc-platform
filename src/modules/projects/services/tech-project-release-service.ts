import "server-only";

import { db } from "@/lib/prisma";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { Prisma, ProjectStatus } from "@prisma/client";
import { enqueueTechEmail } from "@/modules/email/services/tech-email-service";

const PLATFORM_FEE_PERCENT = 10;

type ReleaseSource = "CLIENT_APPROVAL" | "AUTO_REVIEW_DEADLINE";

type ReleaseTechProjectInput = {
  projectId: string;
  source: ReleaseSource;
  clientId?: string;
  rating?: number;
  comment?: string;
};

export async function releaseTechProjectPayment({
  projectId,
  source,
  clientId,
  rating,
  comment,
}: ReleaseTechProjectInput) {
  return db.$transaction(
    async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          title: true,
          ownerId: true,
          professionalId: true,
          agreedPrice: true,
          status: true,
          owner: {
            select: { id: true, email: true, name: true, displayName: true },
          },
          professional: {
            select: { id: true, email: true, name: true, displayName: true },
          },
        },
      });

      if (!project) throw new Error("PROJECT_NOT_FOUND");
      if (!project.professionalId || !project.agreedPrice) {
        throw new Error("PROJECT_PAYMENT_DATA_MISSING");
      }
      if (!project.professional) throw new Error("PROFESSIONAL_NOT_FOUND");
      if (source === "CLIENT_APPROVAL" && project.ownerId !== clientId) {
        throw new Error("PROJECT_OWNER_REQUIRED");
      }
      if (project.status !== ProjectStatus.UNDER_REVIEW) {
        return { released: false, project };
      }

      const professionalAmount = project.agreedPrice
        .mul(100 - PLATFORM_FEE_PERCENT)
        .div(100)
        .toDecimalPlaces(2);

      let nextRating: { average: number; count: number } | null = null;
      if (source === "CLIENT_APPROVAL") {
        if (!clientId || !Number.isInteger(rating) || !rating || rating < 1 || rating > 5) {
          throw new Error("INVALID_REVIEW");
        }

        const existingReview = await tx.review.findUnique({
          where: {
            projectId_authorId: { projectId: project.id, authorId: clientId },
          },
          select: { id: true },
        });
        if (existingReview) throw new Error("REVIEW_ALREADY_SENT");

        const professional = await tx.user.findUnique({
          where: { id: project.professionalId },
          select: { rating: true, ratingCount: true },
        });
        if (!professional) throw new Error("PROFESSIONAL_NOT_FOUND");

        const count = professional.ratingCount + 1;
        nextRating = {
          count,
          average:
            (professional.rating * professional.ratingCount + rating) / count,
        };
      }

      const completed = await tx.project.updateMany({
        where: { id: project.id, status: ProjectStatus.UNDER_REVIEW },
        data: {
          status: ProjectStatus.COMPLETED,
          autoReleasedAt:
            source === "AUTO_REVIEW_DEADLINE" ? new Date() : null,
        },
      });
      if (completed.count !== 1) return { released: false, project };

      await tx.user.update({
        where: { id: project.professionalId },
        data: { walletBalance: { increment: professionalAmount } },
      });

      await tx.transaction.create({
        data: {
          userId: project.professionalId,
          amount: professionalAmount,
          type: "CREDIT",
          status: "COMPLETED",
          description: `Pagamento (Taxa de 10% aplicada) - Projeto: ${project.title}`,
          projectId: project.id,
        },
      });

      if (source === "CLIENT_APPROVAL" && clientId && rating && nextRating) {
        await tx.review.create({
          data: {
            projectId: project.id,
            authorId: clientId,
            targetId: project.professionalId,
            rating,
            comment: comment?.trim() || null,
          },
        });
        await tx.user.update({
          where: { id: project.professionalId },
          data: {
            rating: nextRating.average,
            ratingCount: nextRating.count,
          },
        });
      }

      await upsertNotification(
        {
          userId: project.professionalId,
          actorId: source === "CLIENT_APPROVAL" ? project.ownerId : null,
          type: "SUCCESS",
          eventType: "TECH_PAYMENT_RELEASED",
          title: "Pagamento liberado",
          message:
            source === "CLIENT_APPROVAL"
              ? `O cliente aprovou "${project.title}". O valor ja esta disponivel na sua carteira.`
              : `O prazo de analise de "${project.title}" terminou sem contestacao. O valor foi liberado na sua carteira.`,
          link: "/dashboard/financeiro",
          entityType: "TECH_PROJECT",
          entityId: project.id,
          metadata: {
            projectId: project.id,
            amount: professionalAmount.toNumber(),
            source,
          },
        },
        tx,
      );

      if (source === "AUTO_REVIEW_DEADLINE") {
        await upsertNotification(
          {
            userId: project.ownerId,
            type: "INFO",
            eventType: "TECH_PROJECT_AUTO_COMPLETED",
            title: "Prazo de analise encerrado",
            message: `O projeto "${project.title}" foi finalizado apos 7 dias sem pedido de revisao ou disputa.`,
            link: "/dashboard/meus-projetos",
            entityType: "TECH_PROJECT",
            entityId: project.id,
            metadata: { projectId: project.id, source },
          },
          tx,
        );
      }

      const completionLine =
        source === "CLIENT_APPROVAL"
          ? "O cliente aprovou a entrega e o projeto foi concluido."
          : "O prazo de analise terminou sem contestacao e o projeto foi concluido automaticamente.";

      await enqueueTechEmail(tx, {
        idempotencyKey: `TECH_PROJECT_COMPLETED:${project.id}:${project.owner.id}`,
        eventType: "TECH_PROJECT_COMPLETED",
        templateKey: "tech.project.completed",
        recipient: project.owner,
        entityType: "TECH_PROJECT",
        entityId: project.id,
        content: {
          title: "Projeto concluido",
          preview: `${project.title} foi concluido.`,
          lines: [
            completionLine,
            "O pagamento protegido foi liberado ao profissional conforme as regras da plataforma.",
          ],
          details: [{ label: "Projeto", value: project.title }],
          actionLabel: "Ver projeto",
          actionPath: "/dashboard/meus-projetos",
        },
      });

      await enqueueTechEmail(tx, {
        idempotencyKey: `TECH_PROJECT_COMPLETED:${project.id}:${project.professional.id}`,
        eventType: "TECH_PROJECT_COMPLETED",
        templateKey: "tech.project.completed",
        recipient: project.professional,
        entityType: "TECH_PROJECT",
        entityId: project.id,
        content: {
          title: "Projeto concluido e pagamento liberado",
          preview: `${project.title} foi concluido e o pagamento esta disponivel.`,
          lines: [
            completionLine,
            "O valor liquido ja esta disponivel na sua carteira.",
          ],
          details: [
            { label: "Projeto", value: project.title },
            {
              label: "Valor liberado",
              value: professionalAmount.toNumber().toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              }),
            },
          ],
          actionLabel: "Abrir financeiro",
          actionPath: "/dashboard/financeiro",
        },
      });

      return {
        released: true,
        project,
        professionalAmount: professionalAmount.toNumber(),
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}
