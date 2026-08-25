"use server";

import { verifySession } from "@/lib/auth";
import { getAdminAccess } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createAdminAuditLog } from "@/modules/admin/actions/audit-log";
import { ActionResponse } from "@/modules/users/types/user-types";
import {
  Prisma,
  ProjectCheckoutHoldStatus,
  ProjectStatus,
  ProposalStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import { sendAdminNotification } from "@/modules/admin/services/admin-notification-service";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { canCancelPaidTechProject } from "@/modules/projects/lib/tech-project-cancellation";
import { validateAdminDecisionReason } from "@/modules/admin/lib/admin-decision-reason";
import { enqueueTechEmail } from "@/modules/email/services/tech-email-service";

const PLATFORM_FEE_PERCENT = 10;
const ADMIN_DISPUTE_DECISION_LIMIT = 20;
const ADMIN_DISPUTE_DECISION_WINDOW_MS = 10 * 60 * 1000;

type DisputeDecision = "REFUND_CLIENT" | "RELEASE_TO_PROFESSIONAL";

function normalizeReason(reason?: string) {
  return reason?.trim().replace(/\s+/g, " ") || "";
}

function techProjectPaths(projectId?: string, professionalId?: string | null) {
  revalidatePath("/dashboard/meus-projetos");
  revalidatePath("/dashboard/projetos-ativos");
  revalidatePath("/dashboard/minhas-propostas");
  revalidatePath("/dashboard/anuncios");
  revalidatePath("/dashboard/financeiro");

  if (projectId) {
    revalidatePath(`/dashboard/encontrar-projetos/${projectId}`);
  }

  if (professionalId) {
    revalidatePath(`/dashboard/profissional/${professionalId}`);
  }
}

function projectProfessionalAmount(amount: Prisma.Decimal) {
  return amount
    .mul(100 - PLATFORM_FEE_PERCENT)
    .div(100)
    .toDecimalPlaces(2);
}

type TechDisputeEmailUser = {
  id: string;
  email: string;
  name: string;
  displayName: string | null;
};

async function queueTechDisputeResolutionCommunications(
  tx: Prisma.TransactionClient,
  input: {
    projectId: string;
    projectTitle: string;
    amount: number;
    owner: TechDisputeEmailUser;
    professional: TechDisputeEmailUser;
    adminId: string;
    decision: DisputeDecision;
    reason: string;
  },
) {
  const clientWon = input.decision === "REFUND_CLIENT";
  const recipients = [
    {
      user: input.owner,
      actionPath: "/dashboard/meus-projetos",
      message: clientWon
        ? `A mediacao aprovou o reembolso do projeto "${input.projectTitle}".`
        : `A mediacao liberou o pagamento do projeto "${input.projectTitle}" ao profissional.`,
    },
    {
      user: input.professional,
      actionPath: "/dashboard/projetos-ativos",
      message: clientWon
        ? `A mediacao aprovou o reembolso do projeto "${input.projectTitle}".`
        : `A mediacao liberou o pagamento do projeto "${input.projectTitle}" para sua carteira.`,
    },
  ];

  for (const recipient of recipients) {
    await upsertNotification({
      userId: recipient.user.id,
      actorId: input.adminId,
      type: clientWon ? "WARNING" : "SUCCESS",
      eventType: "TECH_DISPUTE_RESOLVED",
      title: "Disputa resolvida",
      message: recipient.message,
      link: recipient.actionPath,
      entityType: "TECH_PROJECT",
      entityId: input.projectId,
      metadata: {
        decision: input.decision,
        reason: input.reason,
        amount: input.amount,
      },
    }, tx);

    await enqueueTechEmail(tx, {
      idempotencyKey: `TECH_DISPUTE_RESOLVED:${input.projectId}:${input.decision}:${recipient.user.id}`,
      eventType: "TECH_DISPUTE_RESOLVED",
      templateKey: "tech.dispute.resolved",
      recipient: recipient.user,
      entityType: "TECH_PROJECT",
      entityId: input.projectId,
      content: {
        title: "Disputa resolvida",
        preview: `A mediacao de ${input.projectTitle} foi concluida.`,
        lines: [
          recipient.message,
          clientWon
            ? "O reembolso seguira o prazo do metodo de pagamento original."
            : "O projeto foi concluido e o pagamento foi liberado ao profissional.",
        ],
        details: [
          { label: "Projeto", value: input.projectTitle },
          { label: "Decisao", value: clientWon ? "Reembolso ao cliente" : "Pagamento ao profissional" },
          { label: "Justificativa", value: input.reason },
        ],
        actionLabel: "Ver resultado",
        actionPath: recipient.actionPath,
      },
    });
  }
}

async function requireAdmin() {
  const access = await getAdminAccess(["OWNER", "SUPPORT"]);

  if (access.status === "UNAUTHENTICATED") {
    return { error: "Nao autorizado." };
  }

  if (access.status === "FORBIDDEN") {
    return { error: "Acao restrita a administradores." };
  }

  return {
    session: {
      sub: access.session.id,
      adminRole: access.session.adminRole,
    },
  };
}

async function claimTechDisputeDecision({
  projectId,
  decision,
  adminId,
}: {
  projectId: string;
  decision: DisputeDecision;
  adminId: string;
}) {
  const claimed = await db.project.updateMany({
    where: {
      id: projectId,
      status: ProjectStatus.DISPUTE,
      disputeDecisionClaim: null,
    },
    data: {
      disputeDecisionClaim: decision,
      disputeDecisionClaimedAt: new Date(),
      disputeDecisionClaimedBy: adminId,
    },
  });

  if (claimed.count === 1) return;

  const current = await db.project.findUnique({
    where: { id: projectId },
    select: { status: true, disputeDecisionClaim: true },
  });
  if (!current || current.status !== ProjectStatus.DISPUTE) {
    throw new Error("A disputa ja foi resolvida por outra operacao.");
  }
  if (current.disputeDecisionClaim !== decision) {
    throw new Error(
      "Esta disputa ja possui outra decisao em processamento. Atualize a pagina.",
    );
  }
}

export async function withdrawProposal(
  proposalId: string,
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    const userId = session?.sub;

    if (!userId) return { success: false, error: "Nao autorizado." };

    if (session?.userType !== "PROFESSIONAL" || session.industry !== "TECH") {
      return {
        success: false,
        error: "Acao restrita a profissionais de Tecnologia.",
      };
    }

    if (!proposalId) {
      return { success: false, error: "Proposta invalida." };
    }

    const proposal = await db.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        status: true,
        professionalId: true,
        projectId: true,
        professional: {
          select: { id: true, email: true, name: true, displayName: true },
        },
        project: {
          select: {
            status: true,
            title: true,
            ownerId: true,
            owner: {
              select: { id: true, email: true, name: true, displayName: true },
            },
          },
        },
      },
    });

    if (!proposal || proposal.professionalId !== userId) {
      return { success: false, error: "Proposta nao encontrada." };
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      return {
        success: false,
        error: "Apenas propostas pendentes podem ser retiradas.",
      };
    }

    if (proposal.project.status !== ProjectStatus.OPEN) {
      return {
        success: false,
        error: "Nao e possivel retirar proposta de um projeto em pagamento ou execucao.",
      };
    }

    const withdrawnAt = new Date();
    const stripeSessionIds = await db.$transaction(async (tx) => {
      const withdrawn = await tx.proposal.updateMany({
        where: {
          id: proposal.id,
          professionalId: userId,
          status: ProposalStatus.PENDING,
          project: { status: ProjectStatus.OPEN },
        },
        data: { status: ProposalStatus.WITHDRAWN, updatedAt: withdrawnAt },
      });

      if (withdrawn.count !== 1) return null;

      await tx.project.updateMany({
        where: {
          id: proposal.projectId,
          status: ProjectStatus.OPEN,
          bidsCount: { gt: 0 },
        },
        data: {
          bidsCount: { decrement: 1 },
        },
      });

      const activeHolds = await tx.projectCheckoutHold.findMany({
        where: {
          proposalId: proposal.id,
          status: ProjectCheckoutHoldStatus.PENDING,
        },
        select: { stripeSessionId: true },
      });

      await tx.projectCheckoutHold.updateMany({
        where: {
          proposalId: proposal.id,
          status: ProjectCheckoutHoldStatus.PENDING,
        },
        data: {
          status: ProjectCheckoutHoldStatus.CANCELED,
          canceledAt: new Date(),
          failureReason: "Proposta retirada pelo profissional.",
        },
      });

      await upsertNotification({
        userId: proposal.project.ownerId,
        actorId: userId,
        type: "INFO",
        eventType: "TECH_PROPOSAL_WITHDRAWN",
        title: "Proposta retirada",
        message: `Uma proposta para "${proposal.project.title}" foi retirada pelo profissional.`,
        link: "/dashboard/meus-projetos",
        entityType: "TECH_PROJECT",
        entityId: proposal.projectId,
        metadata: { proposalId: proposal.id, professionalId: userId },
      }, tx);

      await enqueueTechEmail(tx, {
        idempotencyKey: `TECH_PROPOSAL_WITHDRAWN:${proposal.id}:${proposal.project.ownerId}:${withdrawnAt.toISOString()}`,
        eventType: "TECH_PROPOSAL_WITHDRAWN",
        templateKey: "tech.proposal.withdrawn",
        recipient: proposal.project.owner,
        entityType: "TECH_PROJECT",
        entityId: proposal.projectId,
        content: {
          title: "Proposta retirada",
          preview: `Uma proposta para ${proposal.project.title} foi retirada.`,
          lines: [
            `${proposal.professional.displayName || proposal.professional.name} retirou a proposta enviada para o seu projeto.`,
            "As demais propostas continuam disponiveis para analise.",
          ],
          details: [{ label: "Projeto", value: proposal.project.title }],
          actionLabel: "Ver propostas",
          actionPath: "/dashboard/meus-projetos",
        },
      });

      return activeHolds.flatMap((hold) =>
        hold.stripeSessionId ? [hold.stripeSessionId] : [],
      );
    });

    if (!stripeSessionIds) {
      return {
        success: false,
        error: "A proposta mudou de status e nao pode mais ser retirada.",
      };
    }

    const expirationResults = await Promise.allSettled(
      stripeSessionIds.map((sessionId) =>
        stripe.checkout.sessions.expire(sessionId),
      ),
    );

    expirationResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error("[EXPIRE_WITHDRAWN_PROPOSAL_CHECKOUT_ERROR]", {
          proposalId: proposal.id,
          stripeSessionId: stripeSessionIds[index],
          error: result.reason,
        });
      }
    });

    techProjectPaths(proposal.projectId, userId);

    return { success: true };
  } catch (error) {
    console.error("[WITHDRAW_TECH_PROPOSAL_ERROR]", error);
    return { success: false, error: "Erro ao retirar proposta." };
  }
}

export async function cancelTechProject(
  projectId: string,
  reason?: string,
): Promise<ActionResponse> {
  let paidCancellationClaimed = false;
  let refundId: string | null = null;

  try {
    const session = await verifySession();
    const userId = session?.sub;

    if (!userId) return { success: false, error: "Nao autorizado." };

    if (session?.userType === "ADMIN") {
      return {
        success: false,
        error: "Contas administrativas nao podem cancelar projetos como cliente.",
      };
    }

    if (!projectId) {
      return { success: false, error: "Projeto invalido." };
    }

    const normalizedReason = normalizeReason(reason);

    if (normalizedReason.length < 10) {
      return {
        success: false,
        error: "Descreva o motivo do cancelamento com pelo menos 10 caracteres.",
      };
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        status: true,
        professionalId: true,
        agreedPrice: true,
        stripePaymentIntentId: true,
        owner: {
          select: { id: true, email: true, name: true, displayName: true },
        },
        professional: {
          select: { id: true, email: true, name: true, displayName: true },
        },
      },
    });

    if (!project || project.ownerId !== userId) {
      return { success: false, error: "Projeto nao encontrado." };
    }

    const isUnpaidCancellation =
      project.status === ProjectStatus.OPEN ||
      project.status === ProjectStatus.WAITING_PAYMENT;
    const isPaidCancellation = project.status === ProjectStatus.IN_PROGRESS;

    if (!isUnpaidCancellation && !isPaidCancellation) {
      return {
        success: false,
        error:
          "Este pedido nao pode mais ser cancelado. Use a disputa apenas em caso de problema com o servico.",
      };
    }

    const completedHold = isPaidCancellation
      ? await db.projectCheckoutHold.findFirst({
          where: {
            projectId: project.id,
            status: ProjectCheckoutHoldStatus.COMPLETED,
            completedAt: { not: null },
          },
          orderBy: { completedAt: "desc" },
          select: { completedAt: true },
        })
      : null;

    if (isPaidCancellation) {
      if (!completedHold?.completedAt) {
        return {
          success: false,
          error:
            "Nao foi possivel confirmar o prazo do pagamento. Contate o suporte.",
        };
      }

      if (!canCancelPaidTechProject(completedHold.completedAt)) {
        return {
          success: false,
          error:
            "O prazo de 12 horas para cancelamento e estorno foi encerrado.",
        };
      }

      if (!project.stripePaymentIntentId || !project.agreedPrice) {
        return {
          success: false,
          error: "Pagamento Stripe nao encontrado para estorno.",
        };
      }

      const claimed = await db.$transaction(async (tx) => {
        const freshCompletedHold = await tx.projectCheckoutHold.findFirst({
          where: {
            projectId: project.id,
            status: ProjectCheckoutHoldStatus.COMPLETED,
            completedAt: { not: null },
          },
          orderBy: { completedAt: "desc" },
          select: { completedAt: true },
        });

        if (
          !freshCompletedHold?.completedAt ||
          !canCancelPaidTechProject(freshCompletedHold.completedAt)
        ) {
          return false;
        }

        const result = await tx.project.updateMany({
          where: {
            id: project.id,
            status: ProjectStatus.IN_PROGRESS,
            cancellationProcessingAt: null,
          },
          data: {
            status: ProjectStatus.CANCELED,
            canceledAt: new Date(),
            cancellationProcessingAt: new Date(),
            cancellationReason: normalizedReason,
          },
        });

        return result.count === 1;
      });

      if (!claimed) {
        return {
          success: false,
          error:
            "O projeto foi entregue, mudou de status ou ja possui um cancelamento em processamento.",
        };
      }

      paidCancellationClaimed = true;
    }

    if (isPaidCancellation && project.stripePaymentIntentId) {
      const refund = await stripe.refunds.create(
        { payment_intent: project.stripePaymentIntentId },
        { idempotencyKey: `tech-project-12h-cancellation-${project.id}` },
      );
      refundId = refund.id;
    }

    await db.$transaction(async (tx) => {
      const freshProject = await tx.project.findUnique({
        where: { id: project.id },
        select: {
          status: true,
          agreedPrice: true,
          cancellationProcessingAt: true,
        },
      });

      if (!freshProject) throw new Error("PROJECT_NOT_FOUND");

      const freshStatusAllowed = isPaidCancellation
        ? freshProject.status === ProjectStatus.CANCELED &&
          Boolean(freshProject.cancellationProcessingAt)
        : freshProject.status === ProjectStatus.OPEN ||
          freshProject.status === ProjectStatus.WAITING_PAYMENT;

      if (!freshStatusAllowed) throw new Error("PROJECT_STATUS_CHANGED");

      await tx.project.update({
        where: { id: project.id },
        data: {
          status: ProjectStatus.CANCELED,
          canceledAt: new Date(),
          cancellationProcessingAt: null,
          cancellationReason: normalizedReason,
        },
      });

      await tx.deliverable.create({
        data: {
          projectId: project.id,
          senderId: userId,
          description: `${isPaidCancellation ? "PROJECT_CANCELED_WITH_REFUND" : "PROJECT_CANCELED"} - ${normalizedReason}${refundId ? ` - Stripe: ${refundId}` : ""}`,
        },
      });

      if (isPaidCancellation && freshProject.agreedPrice) {
        const existingRefundTransaction = await tx.transaction.findFirst({
          where: {
            projectId: project.id,
            userId: project.ownerId,
            type: "CREDIT",
            description: { contains: "Cancelamento em ate 12 horas" },
          },
          select: { id: true },
        });

        if (!existingRefundTransaction) {
          await tx.transaction.create({
            data: {
              userId: project.ownerId,
              amount: freshProject.agreedPrice,
              type: "CREDIT",
              status: "COMPLETED",
              description: `Cancelamento em ate 12 horas - Estorno ao cartao - Projeto: ${project.title}${refundId ? ` - Stripe: ${refundId}` : ""}`,
              projectId: project.id,
            },
          });
        }
      }

      if (isUnpaidCancellation) {
        await tx.proposal.updateMany({
          where: {
            projectId: project.id,
            status: ProposalStatus.PENDING,
          },
          data: { status: ProposalStatus.REJECTED },
        });
      }

      if (project.professional) {
        await upsertNotification({
          userId: project.professionalId,
          actorId: userId,
          type: "WARNING",
          eventType: "TECH_PROJECT_CANCELED",
          title: "Projeto cancelado",
          message: `O projeto "${project.title}" foi cancelado pelo cliente.`,
          link: "/dashboard/projetos-ativos",
          entityType: "TECH_PROJECT",
          entityId: project.id,
          metadata: {
            reason: normalizedReason,
            refundId,
            cancellationType: isPaidCancellation
              ? "PAID_WITHIN_12H"
              : "UNPAID",
          },
        }, tx);

        await enqueueTechEmail(tx, {
          idempotencyKey: `TECH_PROJECT_CANCELED:${project.id}:${project.professional.id}`,
          eventType: "TECH_PROJECT_CANCELED",
          templateKey: "tech.project.canceled",
          recipient: project.professional,
          entityType: "TECH_PROJECT",
          entityId: project.id,
          content: {
            title: "Projeto cancelado",
            preview: `${project.title} foi cancelado pelo cliente.`,
            lines: [
              "O cliente cancelou o projeto.",
              isPaidCancellation
                ? "O cancelamento ocorreu dentro do prazo permitido e o pagamento sera estornado ao cliente."
                : "O projeto foi encerrado antes da confirmacao do pagamento.",
            ],
            details: [
              { label: "Projeto", value: project.title },
              { label: "Motivo", value: normalizedReason },
            ],
            actionLabel: "Ver projetos",
            actionPath: "/dashboard/projetos-ativos",
          },
        });
      }

      await upsertNotification({
        userId: project.ownerId,
        actorId: userId,
        type: isPaidCancellation ? "SUCCESS" : "INFO",
        eventType: "TECH_PROJECT_CANCELED_CLIENT",
        title: "Pedido cancelado",
        message: isPaidCancellation
          ? `O pedido "${project.title}" foi cancelado e o estorno foi enviado ao cartao.`
          : `O pedido "${project.title}" foi cancelado.`,
        link: "/dashboard/meus-projetos",
        entityType: "TECH_PROJECT",
        entityId: project.id,
        metadata: { reason: normalizedReason, refundId },
      }, tx);

      await enqueueTechEmail(tx, {
        idempotencyKey: `TECH_PROJECT_CANCELED:${project.id}:${project.owner.id}`,
        eventType: "TECH_PROJECT_CANCELED",
        templateKey: "tech.project.canceled",
        recipient: project.owner,
        entityType: "TECH_PROJECT",
        entityId: project.id,
        content: {
          title: "Projeto cancelado",
          preview: `${project.title} foi cancelado.`,
          lines: [
            "Seu projeto foi cancelado com sucesso.",
            isPaidCancellation
              ? "A Stripe recebeu a solicitacao de estorno para o metodo de pagamento original."
              : "Nenhum pagamento foi capturado para este projeto.",
          ],
          details: [
            { label: "Projeto", value: project.title },
            { label: "Motivo", value: normalizedReason },
          ],
          actionLabel: "Ver meus projetos",
          actionPath: "/dashboard/meus-projetos",
        },
      });
    });

    techProjectPaths(project.id, project.professionalId);

    await sendAdminNotification({
      roles: ["OWNER", "SUPPORT"],
      subject: "MWC Admin - Projeto Tech cancelado",
      lines: [
        isPaidCancellation
          ? "Um projeto Tech foi cancelado dentro do prazo de 12 horas e estornado ao cartao."
          : "Um projeto Tech foi cancelado antes do pagamento.",
        `Projeto: ${project.id}`,
        `Cancelado por: ${userId}`,
        `Motivo: ${normalizedReason}`,
        `Estorno Stripe: ${refundId || "Nao aplicavel"}`,
      ],
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://maximusworldclick.com.br"}/dashboard/admin/financeiro`,
    });

    return { success: true };
  } catch (error) {
    if (paidCancellationClaimed && !refundId) {
      await db.project.updateMany({
        where: {
          id: projectId,
          status: ProjectStatus.CANCELED,
          cancellationProcessingAt: { not: null },
        },
        data: {
          status: ProjectStatus.IN_PROGRESS,
          canceledAt: null,
          cancellationProcessingAt: null,
          cancellationReason: null,
        },
      });
    }
    console.error("[CANCEL_TECH_PROJECT_ERROR]", error);
    return { success: false, error: "Erro ao cancelar projeto." };
  }
}

export async function requestTechProjectRevision(
  projectId: string,
  reason: string,
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    const userId = session?.sub;

    if (!userId) return { success: false, error: "Nao autorizado." };

    if (session?.userType === "ADMIN") {
      return {
        success: false,
        error:
          "Contas administrativas nao podem solicitar revisao como cliente.",
      };
    }

    const normalizedReason = normalizeReason(reason);

    if (normalizedReason.length < 10) {
      return {
        success: false,
        error: "Descreva a revisao com pelo menos 10 caracteres.",
      };
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        status: true,
        professionalId: true,
        owner: { select: { name: true, displayName: true } },
        professional: {
          select: { id: true, email: true, name: true, displayName: true },
        },
      },
    });

    if (!project || project.ownerId !== userId) {
      return { success: false, error: "Projeto nao encontrado." };
    }

    if (project.status !== ProjectStatus.UNDER_REVIEW) {
      return {
        success: false,
        error: "Apenas entregas em revisao podem receber pedido de ajuste.",
      };
    }

    const revisionRequestedAt = new Date();
    await db.$transaction(async (tx) => {
      await tx.deliverable.create({
        data: {
          projectId: project.id,
          senderId: userId,
          description: `REVISION_REQUEST - ${normalizedReason}`,
        },
      });

      await tx.project.update({
        where: { id: project.id },
        data: {
          status: ProjectStatus.IN_PROGRESS,
          deliveredAt: null,
          reviewDeadlineAt: null,
          reviewReminder3dSentAt: null,
          reviewReminder1dSentAt: null,
          autoReleasedAt: null,
          revisionRequestedAt,
          revisionReason: normalizedReason,
        },
      });

      if (project.professional) {
        await upsertNotification({
          userId: project.professionalId,
          actorId: userId,
          type: "WARNING",
          eventType: "TECH_REVISION_REQUESTED",
          title: "Revisao solicitada",
          message: `O cliente pediu ajustes no projeto "${project.title}".`,
          link: "/dashboard/projetos-ativos",
          entityType: "TECH_PROJECT",
          entityId: project.id,
          metadata: { reason: normalizedReason },
        }, tx);

        await enqueueTechEmail(tx, {
          idempotencyKey: `TECH_REVISION_REQUESTED:${project.id}:${revisionRequestedAt.toISOString()}:${project.professional.id}`,
          eventType: "TECH_REVISION_REQUESTED",
          templateKey: "tech.revision.requested",
          recipient: project.professional,
          entityType: "TECH_PROJECT",
          entityId: project.id,
          content: {
            title: "Ajustes solicitados no projeto",
            preview: `O cliente solicitou ajustes em ${project.title}.`,
            lines: [
              `${project.owner.displayName || project.owner.name} analisou a entrega e solicitou ajustes.`,
              "Revise as observacoes no painel e envie uma nova entrega quando concluir.",
            ],
            details: [
              { label: "Projeto", value: project.title },
              { label: "Solicitacao", value: normalizedReason },
            ],
            actionLabel: "Ver ajustes",
            actionPath: "/dashboard/projetos-ativos",
          },
        });
      }
    });

    techProjectPaths(project.id, project.professionalId);

    return { success: true };
  } catch (error) {
    console.error("[REQUEST_TECH_PROJECT_REVISION_ERROR]", error);
    return { success: false, error: "Erro ao solicitar revisao." };
  }
}

export async function openTechProjectDispute(
  projectId: string,
  reason: string,
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    const userId = session?.sub;

    if (!userId) return { success: false, error: "Nao autorizado." };

    const normalizedReason = normalizeReason(reason);

    if (normalizedReason.length < 10) {
      return {
        success: false,
        error: "Descreva a disputa com pelo menos 10 caracteres.",
      };
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        professionalId: true,
        status: true,
        owner: {
          select: { id: true, email: true, name: true, displayName: true },
        },
        professional: {
          select: { id: true, email: true, name: true, displayName: true },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Projeto nao encontrado." };
    }

    const isClientOwner =
      session.userType !== "ADMIN" && project.ownerId === userId;
    const isAssignedTechProfessional =
      session.userType === "PROFESSIONAL" &&
      session.industry === "TECH" &&
      project.professionalId === userId;
    const isAdmin = session.role === "ADMIN" || session.userType === "ADMIN";

    if (!isClientOwner && !isAssignedTechProfessional && !isAdmin) {
      return {
        success: false,
        error: "Voce nao tem permissao para disputar este projeto.",
      };
    }

    if (
      project.status !== ProjectStatus.IN_PROGRESS &&
      project.status !== ProjectStatus.UNDER_REVIEW
    ) {
      return {
        success: false,
        error: "Apenas projetos em execucao ou revisao podem entrar em disputa.",
      };
    }

    const counterpartyId =
      project.ownerId === userId ? project.professionalId : project.ownerId;
    await db.$transaction(async (tx) => {
      await tx.deliverable.create({
        data: {
          projectId: project.id,
          senderId: userId,
          description: `DISPUTE_OPENED - ${normalizedReason}`,
        },
      });

      await tx.project.update({
        where: { id: project.id },
        data: {
          status: ProjectStatus.DISPUTE,
          disputeReason: normalizedReason,
          disputeOpenedAt: new Date(),
          disputeResolvedAt: null,
          disputeResolution: null,
        },
      });

      if (counterpartyId) {
        await upsertNotification({
        userId: counterpartyId,
        actorId: userId,
        type: "WARNING",
        eventType: "TECH_DISPUTE_OPENED",
        title: "Disputa aberta",
        message: `Uma disputa foi aberta no projeto "${project.title}".`,
        link: "/dashboard/projetos-ativos",
        entityType: "TECH_PROJECT",
        entityId: project.id,
        metadata: { reason: normalizedReason },
        }, tx);
      }

      const recipients = [
        {
          user: project.owner,
          actionPath: "/dashboard/meus-projetos",
        },
        ...(project.professional
          ? [
              {
                user: project.professional,
                actionPath: "/dashboard/projetos-ativos",
              },
            ]
          : []),
      ];

      for (const recipient of recipients) {
        await enqueueTechEmail(tx, {
          idempotencyKey: `TECH_DISPUTE_OPENED:${project.id}:${recipient.user.id}`,
          eventType: "TECH_DISPUTE_OPENED",
          templateKey: "tech.dispute.opened",
          recipient: recipient.user,
          entityType: "TECH_PROJECT",
          entityId: project.id,
          content: {
            title: "Disputa aberta no projeto",
            preview: `Uma disputa foi aberta em ${project.title}.`,
            lines: [
              "Uma disputa foi registrada e o projeto entrou em mediacao administrativa.",
              "O pagamento permanece protegido enquanto a equipe analisa o caso.",
            ],
            details: [
              { label: "Projeto", value: project.title },
              { label: "Motivo informado", value: normalizedReason },
            ],
            actionLabel: "Acompanhar disputa",
            actionPath: recipient.actionPath,
          },
        });
      }
    });

    techProjectPaths(project.id, project.professionalId);

    await sendAdminNotification({
      roles: ["OWNER", "SUPPORT"],
      subject: "MWC Admin - Disputa Tech aberta",
      lines: [
        "Uma disputa Tech foi aberta e precisa de acompanhamento.",
        `Projeto: ${project.id}`,
        `Aberta por: ${userId}`,
        `Motivo: ${normalizedReason}`,
      ],
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://maximusworldclick.com.br"}/dashboard/admin/disputas/tech/${project.id}`,
      notification: {
        eventType: "ADMIN_TECH_DISPUTE_OPENED",
        entityType: "TECH_PROJECT",
        entityId: project.id,
        title: "Disputa Tech aberta",
        message: "Uma disputa de projeto Tech precisa de mediacao.",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[OPEN_TECH_PROJECT_DISPUTE_ERROR]", error);
    return { success: false, error: "Erro ao abrir disputa." };
  }
}

export async function resolveTechProjectDispute({
  projectId,
  decision,
  reason,
}: {
  projectId: string;
  decision: DisputeDecision;
  reason?: string;
}): Promise<ActionResponse> {
  try {
    const admin = await requireAdmin();

    if ("error" in admin) {
      return { success: false, error: admin.error };
    }

    const rateLimitError = await consumeRateLimit({
      key: `admin:tech-dispute-decision:user:${admin.session.sub}`,
      limit: ADMIN_DISPUTE_DECISION_LIMIT,
      windowMs: ADMIN_DISPUTE_DECISION_WINDOW_MS,
      message: "Muitas decisoes de disputa em sequencia. Aguarde um instante.",
    });

    if (rateLimitError) {
      return { success: false, error: rateLimitError };
    }

    if (!projectId) {
      return { success: false, error: "Projeto invalido." };
    }

    if (decision !== "REFUND_CLIENT" && decision !== "RELEASE_TO_PROFESSIONAL") {
      return { success: false, error: "Decisao de disputa invalida." };
    }

    const reasonResult = validateAdminDecisionReason(reason);
    if (!reasonResult.success) {
      return { success: false, error: reasonResult.error };
    }
    const normalizedReason = reasonResult.value;

    type ProjectDisputePayment = {
      id: string;
      title: string;
      ownerId: string;
      professionalId: string | null;
      agreedPrice: Prisma.Decimal | null;
      status: ProjectStatus;
      owner: TechDisputeEmailUser;
      professional: TechDisputeEmailUser | null;
    };

    const project = (await db.project.findUnique({
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
      } as Prisma.ProjectSelect,
    })) as ProjectDisputePayment | null;

    if (!project) {
      return { success: false, error: "Projeto nao encontrado." };
    }

    if (project.status !== ProjectStatus.DISPUTE) {
      return {
        success: false,
        error: "Apenas projetos em disputa podem ser resolvidos.",
      };
    }

    if (!project.professionalId || !project.agreedPrice) {
      return {
        success: false,
        error: "Projeto sem profissional ou valor acordado.",
      };
    }
    if (!project.professional) {
      return { success: false, error: "Profissional do projeto nao encontrado." };
    }
    const disputeProfessional = project.professional;

    await claimTechDisputeDecision({
      projectId: project.id,
      decision,
      adminId: admin.session.sub,
    });

    await db.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT "id"
        FROM "Project"
        WHERE "id" = ${project.id}
        FOR UPDATE
      `;

      const freshProject = await tx.project.findUnique({
        where: { id: project.id },
        select: {
          id: true,
          title: true,
          ownerId: true,
          professionalId: true,
          agreedPrice: true,
          status: true,
          disputeDecisionClaim: true,
        },
      });

      if (!freshProject) throw new Error("Projeto nao encontrado.");

      if (freshProject.status !== ProjectStatus.DISPUTE) {
        throw new Error("Apenas projetos em disputa podem ser resolvidos.");
      }
      if (freshProject.disputeDecisionClaim !== decision) {
        throw new Error("A decisao da disputa foi alterada por outra operacao.");
      }

      if (!freshProject.professionalId || !freshProject.agreedPrice) {
        throw new Error("Projeto sem profissional ou valor acordado.");
      }

      if (decision === "REFUND_CLIENT") {
        const paymentTransaction = await tx.transaction.findFirst({
          where: {
            projectId: freshProject.id,
            userId: freshProject.ownerId,
            type: "DEBIT",
            status: "COMPLETED",
          },
          orderBy: { createdAt: "desc" },
          select: { description: true },
        });
        const stripeSessionId = paymentTransaction?.description.match(
          /Stripe:\s*(cs_[^\s]+)/,
        )?.[1];

        if (!stripeSessionId) {
          throw new Error("Projeto sem referencia Stripe para reembolso.");
        }

        const checkoutSession =
          await stripe.checkout.sessions.retrieve(stripeSessionId);
        const paymentIntent = checkoutSession.payment_intent;
        const paymentIntentId =
          typeof paymentIntent === "string"
            ? paymentIntent
            : paymentIntent?.id;

        if (!paymentIntentId) {
          throw new Error("Pagamento Stripe nao encontrado para reembolso.");
        }

        const refund = await stripe.refunds.create(
          { payment_intent: paymentIntentId },
          { idempotencyKey: `tech-project-dispute-refund-${freshProject.id}` },
        );
        const refundId = refund.id;

        await tx.project.update({
          where: { id: freshProject.id },
          data: {
            status: ProjectStatus.CANCELED,
            canceledAt: new Date(),
            cancellationReason:
              normalizedReason || "Reembolso aprovado em disputa.",
            disputeResolvedAt: new Date(),
            disputeResolution: "REFUND_CLIENT",
          },
        });

        await tx.transaction.create({
          data: {
            userId: freshProject.ownerId,
            amount: freshProject.agreedPrice,
            type: "CREDIT",
            status: "COMPLETED",
            description: `Reembolso aprovado em disputa - Projeto: ${freshProject.title}${refundId ? ` - Stripe: ${refundId}` : ""}`,
            projectId: freshProject.id,
          },
        });

        await tx.deliverable.create({
          data: {
            projectId: freshProject.id,
            senderId: admin.session.sub,
            description: `DISPUTE_RESOLVED_REFUND - ${normalizedReason || "Nao informado"}${refundId ? ` - Stripe: ${refundId}` : ""}`,
          },
        });

        await createAdminAuditLog(tx, {
          actorId: admin.session.sub,
          action: "TECH_DISPUTE_REFUND_CLIENT",
          entityType: "TECH_PROJECT",
          entityId: freshProject.id,
          reason: normalizedReason || "Nao informado",
          receiptUrl: null,
          metadata: {
            projectTitle: freshProject.title,
            ownerId: freshProject.ownerId,
            professionalId: freshProject.professionalId,
            amount: freshProject.agreedPrice.toNumber(),
            refundId: refundId ?? null,
          },
        });

        await queueTechDisputeResolutionCommunications(tx, {
          projectId: freshProject.id,
          projectTitle: freshProject.title,
          amount: freshProject.agreedPrice.toNumber(),
          owner: project.owner,
          professional: disputeProfessional,
          adminId: admin.session.sub,
          decision,
          reason: normalizedReason || "Nao informado",
        });

        return;
      }

      const existingProfessionalCredit = await tx.transaction.findFirst({
        where: {
          projectId: freshProject.id,
          userId: freshProject.professionalId,
          type: "CREDIT",
          status: "COMPLETED",
        },
        select: { id: true },
      });

      const professionalAmount = projectProfessionalAmount(
        freshProject.agreedPrice,
      );

      if (!existingProfessionalCredit) {
        await tx.user.update({
          where: { id: freshProject.professionalId },
          data: {
            walletBalance: { increment: professionalAmount },
          },
        });

        await tx.transaction.create({
          data: {
            userId: freshProject.professionalId,
            amount: professionalAmount,
            type: "CREDIT",
            status: "COMPLETED",
            description: `Pagamento liberado por mediacao (${PLATFORM_FEE_PERCENT}% taxa) - Projeto: ${freshProject.title}`,
            projectId: freshProject.id,
          },
        });
      }

      await tx.project.update({
        where: { id: freshProject.id },
        data: {
          status: ProjectStatus.COMPLETED,
          disputeResolvedAt: new Date(),
          disputeResolution: "RELEASE_TO_PROFESSIONAL",
        },
      });

      await tx.deliverable.create({
        data: {
          projectId: freshProject.id,
          senderId: admin.session.sub,
          description: `DISPUTE_RESOLVED_RELEASE - ${normalizedReason || "Nao informado"}`,
        },
      });

      await createAdminAuditLog(tx, {
        actorId: admin.session.sub,
        action: "TECH_DISPUTE_RELEASE_PROFESSIONAL",
        entityType: "TECH_PROJECT",
        entityId: freshProject.id,
        reason: normalizedReason || "Nao informado",
        receiptUrl: null,
        metadata: {
          projectTitle: freshProject.title,
          ownerId: freshProject.ownerId,
          professionalId: freshProject.professionalId,
          grossAmount: freshProject.agreedPrice.toNumber(),
          professionalAmount: professionalAmount.toNumber(),
          platformFeePercent: PLATFORM_FEE_PERCENT,
        },
      });

      await queueTechDisputeResolutionCommunications(tx, {
        projectId: freshProject.id,
        projectTitle: freshProject.title,
        amount: freshProject.agreedPrice.toNumber(),
        owner: project.owner,
        professional: disputeProfessional,
        adminId: admin.session.sub,
        decision,
        reason: normalizedReason || "Nao informado",
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 30_000,
    });

    techProjectPaths(project.id, project.professionalId);

    await sendAdminNotification({
      roles: ["OWNER", "SUPPORT"],
      subject: "MWC Admin - Disputa Tech resolvida",
      lines: [
        "Uma disputa Tech foi resolvida pelo painel admin.",
        `Projeto: ${project.id}`,
        `Decisao: ${decision}`,
        `Motivo: ${normalizedReason || "Nao informado"}`,
      ],
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://maximusworldclick.com.br"}/dashboard/admin/disputas/tech/${project.id}`,
    });

    return { success: true };
  } catch (error) {
    console.error("[RESOLVE_TECH_PROJECT_DISPUTE_ERROR]", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao resolver disputa.",
    };
  }
}
