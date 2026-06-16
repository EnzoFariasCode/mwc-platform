"use server";

import { verifySession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createAdminAuditLog } from "@/modules/admin/actions/audit-log";
import { ActionResponse } from "@/modules/users/types/user-types";
import { Prisma, ProjectStatus, ProposalStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

const PLATFORM_FEE_PERCENT = 10;

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
        project: { select: { status: true } },
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

    await db.$transaction(async (tx) => {
      await tx.proposal.update({
        where: { id: proposal.id },
        data: { status: ProposalStatus.WITHDRAWN },
      });

      await tx.project.update({
        where: { id: proposal.projectId },
        data: {
          bidsCount: { decrement: 1 },
        },
      });
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
  try {
    const session = await verifySession();
    const userId = session?.sub;

    if (!userId) return { success: false, error: "Nao autorizado." };

    if (session?.userType !== "CLIENT") {
      return { success: false, error: "Acao restrita a clientes." };
    }

    if (!projectId) {
      return { success: false, error: "Projeto invalido." };
    }

    const normalizedReason = normalizeReason(reason);

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        ownerId: true,
        status: true,
        professionalId: true,
      },
    });

    if (!project || project.ownerId !== userId) {
      return { success: false, error: "Projeto nao encontrado." };
    }

    if (
      project.status !== ProjectStatus.OPEN &&
      project.status !== ProjectStatus.WAITING_PAYMENT
    ) {
      return {
        success: false,
        error: "Projetos pagos devem seguir o fluxo de disputa.",
      };
    }

    await db.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: project.id },
        data: {
          status: ProjectStatus.CANCELED,
        },
      });

      if (normalizedReason) {
        await tx.deliverable.create({
          data: {
            projectId: project.id,
            senderId: userId,
            description: `PROJECT_CANCELED - ${normalizedReason}`,
          },
        });
      }

      await tx.proposal.updateMany({
        where: {
          projectId: project.id,
          status: ProposalStatus.PENDING,
        },
        data: { status: ProposalStatus.REJECTED },
      });
    });

    techProjectPaths(project.id, project.professionalId);

    return { success: true };
  } catch (error) {
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

    if (session?.userType !== "CLIENT") {
      return { success: false, error: "Acao restrita a clientes." };
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
        },
      });
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
        ownerId: true,
        professionalId: true,
        status: true,
      },
    });

    if (!project) {
      return { success: false, error: "Projeto nao encontrado." };
    }

    const isClientOwner =
      session.userType === "CLIENT" && project.ownerId === userId;
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
        },
      });
    });

    techProjectPaths(project.id, project.professionalId);

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

    return { success: true };
  } catch (error) {
    console.error("[RESOLVE_TECH_PROJECT_DISPUTE_ERROR]", error);
    return { success: false, error: "Erro ao resolver disputa." };
  }
}
