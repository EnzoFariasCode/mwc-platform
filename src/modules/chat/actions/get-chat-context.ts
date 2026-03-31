"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { ActionResponse } from "@/modules/users/types/user-types";

async function hasConversation(aId: string, bId: string) {
  const convo = await db.conversation.findFirst({
    where: {
      OR: [
        { participantAId: aId, participantBId: bId },
        { participantAId: bId, participantBId: aId },
      ],
    },
    select: { id: true },
  });
  return !!convo;
}

async function hasSharedProject(aId: string, bId: string) {
  const project = await db.project.findFirst({
    where: {
      OR: [
        { ownerId: aId, professionalId: bId },
        { ownerId: bId, professionalId: aId },
      ],
    },
    select: { id: true },
  });
  return !!project;
}

async function hasSharedProposal(aId: string, bId: string) {
  const proposal = await db.proposal.findFirst({
    where: {
      OR: [
        { professionalId: aId, project: { ownerId: bId } },
        { professionalId: bId, project: { ownerId: aId } },
      ],
    },
    select: { id: true },
  });
  return !!proposal;
}

export async function getProjectContext(
  projectId: string
): Promise<
  ActionResponse<{ title: string; budgetLabel: string; status: string } | null>
> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string | undefined;

    if (!userId) {
      return { success: false, error: "Nao autorizado." };
    }

    if (!projectId) {
      return { success: false, error: "Projeto invalido." };
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        title: true,
        budgetLabel: true,
        status: true,
        ownerId: true,
        professionalId: true,
      },
    });

    if (!project) {
      return { success: false, error: "Projeto nao encontrado." };
    }

    const isOwner = project.ownerId === userId;
    const isAssignedPro = project.professionalId === userId;
    const isAdmin = session?.role === "ADMIN";

    if (!isOwner && !isAssignedPro && !isAdmin) {
      const hasProposal = await db.proposal.findFirst({
        where: { projectId, professionalId: userId },
        select: { id: true },
      });

      if (!hasProposal) {
        return { success: false, error: "Nao autorizado." };
      }
    }

    return {
      success: true,
      data: {
        title: project.title,
        budgetLabel: project.budgetLabel,
        status: project.status,
      },
    };
  } catch {
    return { success: false, error: "Erro interno." };
  }
}

export async function getBasicUserInfo(
  userId: string
): Promise<
  ActionResponse<{ name: string | null; jobTitle: string | null; id: string } | null>
> {
  try {
    const session = await verifySession();
    const myId = session?.sub as string | undefined;

    if (!myId) {
      return { success: false, error: "Nao autorizado." };
    }

    if (!userId) {
      return { success: false, error: "Usuario invalido." };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, jobTitle: true, id: true, userType: true },
    });

    if (!user) {
      return { success: false, error: "Usuario nao encontrado." };
    }

    if (user.id !== myId) {
      const isProfessional = user.userType === "PROFESSIONAL";
      const isAdmin = session?.role === "ADMIN";

      if (!isProfessional && !isAdmin) {
        const [convo, sharedProject, sharedProposal] = await Promise.all([
          hasConversation(myId, user.id),
          hasSharedProject(myId, user.id),
          hasSharedProposal(myId, user.id),
        ]);

        if (!convo && !sharedProject && !sharedProposal) {
          return { success: false, error: "Nao autorizado." };
        }
      }
    }

    return {
      success: true,
      data: { name: user.name, jobTitle: user.jobTitle, id: user.id },
    };
  } catch {
    return { success: false, error: "Erro interno." };
  }
}
