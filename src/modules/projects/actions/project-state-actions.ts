"use server";

import { verifySession } from "@/lib/auth";
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

async function requireAdmin() {
  const session = await verifySession();

  if (!session?.sub) {
    return { error: "Nao autorizado." };
  }

  if (session.role !== "ADMIN" && session.userType !== "ADMIN") {
    return { error: "Acao restrita a administradores." };
  }

  if (session.adminRole !== "OWNER" && session.adminRole !== "SUPPORT") {
    return { error: "Acao restrita ao suporte administrativo." };
  }

  return { session };
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
        project: { select: { status: true, title: true, ownerId: true } },
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

    const stripeSessionIds = await db.$transaction(async (tx) => {
      const withdrawn = await tx.proposal.updateMany({
        where: {
          id: proposal.id,
          professionalId: userId,
          status: ProposalStatus.PENDING,
          project: { status: ProjectStatus.OPEN },
        },
        data: { status: ProposalStatus.WITHDRAWN },
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
    });

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
    });

    techProjectPaths(project.id, project.professionalId);

    await sendAdminNotification({
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

    if (project.professionalId) {
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
          cancellationType: isPaidCancellation ? "PAID_WITHIN_12H" : "UNPAID",
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
          revisionRequestedAt: new Date(),
          revisionReason: normalizedReason,
        },
      });
    });

    techProjectPaths(project.id, project.professionalId);

    if (project.professionalId) {
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
      });
    }

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
    });

    techProjectPaths(project.id, project.professionalId);

    const counterpartyId =
      project.ownerId === userId ? project.professionalId : project.ownerId;

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
      });
    }

    await sendAdminNotification({
      subject: "MWC Admin - Disputa Tech aberta",
      lines: [
        "Uma disputa Tech foi aberta e precisa de acompanhamento.",
        `Projeto: ${project.id}`,
        `Aberta por: ${userId}`,
        `Motivo: ${normalizedReason}`,
      ],
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://maximusworldclick.com.br"}/dashboard/admin/disputas/tech/${project.id}`,
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

    const normalizedReason = normalizeReason(reason);

    type ProjectDisputePayment = {
      id: string;
      title: string;
      ownerId: string;
      professionalId: string | null;
      agreedPrice: Prisma.Decimal | null;
      status: ProjectStatus;
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

    let refundId: string | undefined;

    if (decision === "REFUND_CLIENT") {
      const paymentTransaction = await db.transaction.findFirst({
        where: {
          projectId: project.id,
          userId: project.ownerId,
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
        return {
          success: false,
          error: "Projeto sem referencia Stripe para reembolso.",
        };
      }

      const checkoutSession =
        await stripe.checkout.sessions.retrieve(stripeSessionId);
      const paymentIntent = checkoutSession.payment_intent;
      const paymentIntentId =
        typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;

      if (!paymentIntentId) {
        return {
          success: false,
          error: "Pagamento Stripe nao encontrado para reembolso.",
        };
      }

      const refund = await stripe.refunds.create(
        { payment_intent: paymentIntentId },
        { idempotencyKey: `tech-project-dispute-refund-${project.id}` },
      );
      refundId = refund.id;
    }

    await db.$transaction(async (tx) => {
      const freshProject = await tx.project.findUnique({
        where: { id: project.id },
        select: {
          id: true,
          title: true,
          ownerId: true,
          professionalId: true,
          agreedPrice: true,
          status: true,
        },
      });

      if (!freshProject) throw new Error("Projeto nao encontrado.");

      if (freshProject.status !== ProjectStatus.DISPUTE) {
        throw new Error("Apenas projetos em disputa podem ser resolvidos.");
      }

      if (!freshProject.professionalId || !freshProject.agreedPrice) {
        throw new Error("Projeto sem profissional ou valor acordado.");
      }

      if (decision === "REFUND_CLIENT") {
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
    });

    techProjectPaths(project.id, project.professionalId);

    await sendAdminNotification({
      subject: "MWC Admin - Disputa Tech resolvida",
      lines: [
        "Uma disputa Tech foi resolvida pelo painel admin.",
        `Projeto: ${project.id}`,
        `Decisao: ${decision}`,
        `Motivo: ${normalizedReason || "Nao informado"}`,
      ],
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://maximusworldclick.com.br"}/dashboard/admin/disputas/tech/${project.id}`,
    });

    const clientWon = decision === "REFUND_CLIENT";

    await upsertNotification({
      userId: project.ownerId,
      actorId: admin.session.sub,
      type: clientWon ? "SUCCESS" : "INFO",
      eventType: "TECH_DISPUTE_RESOLVED",
      title: "Disputa resolvida",
      message: clientWon
        ? `A mediacao aprovou o reembolso do projeto "${project.title}".`
        : `A mediacao liberou o pagamento do projeto "${project.title}" ao profissional.`,
      link: "/dashboard/meus-projetos",
      entityType: "TECH_PROJECT",
      entityId: project.id,
      metadata: {
        decision,
        reason: normalizedReason || null,
        amount: project.agreedPrice.toNumber(),
      },
    });

    await upsertNotification({
      userId: project.professionalId,
      actorId: admin.session.sub,
      type: clientWon ? "WARNING" : "SUCCESS",
      eventType: "TECH_DISPUTE_RESOLVED",
      title: "Disputa resolvida",
      message: clientWon
        ? `A mediacao aprovou o reembolso do projeto "${project.title}".`
        : `A mediacao liberou o pagamento do projeto "${project.title}" para sua carteira.`,
      link: "/dashboard/projetos-ativos",
      entityType: "TECH_PROJECT",
      entityId: project.id,
      metadata: {
        decision,
        reason: normalizedReason || null,
        amount: project.agreedPrice.toNumber(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[RESOLVE_TECH_PROJECT_DISPUTE_ERROR]", error);
    return { success: false, error: "Erro ao resolver disputa." };
  }
}
