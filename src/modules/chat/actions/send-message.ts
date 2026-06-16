"use server";

import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";

async function hasSharedTechContext(senderId: string, receiverId: string) {
  const project = await db.project.findFirst({
    where: {
      OR: [
        { ownerId: senderId, professionalId: receiverId },
        { ownerId: receiverId, professionalId: senderId },
        {
          ownerId: senderId,
          proposals: { some: { professionalId: receiverId } },
        },
        {
          ownerId: receiverId,
          proposals: { some: { professionalId: senderId } },
        },
      ],
    },
    select: { id: true },
  });

  return Boolean(project);
}

export async function sendMessage(
  receiverId: string,
  content: string,
): Promise<ActionResponse<{ id: string; createdAt: Date }>> {
  try {
    const session = await verifySession();
    const senderId = session?.sub as string;
    const normalizedContent = content.trim();

    if (!senderId) return { success: false, error: "Nao autorizado." };

    if (session?.industry !== "TECH") {
      return {
        success: false,
        error: "Acao restrita ao Marketplace Tech.",
      };
    }

    if (!receiverId || receiverId === senderId) {
      return { success: false, error: "Destinatario invalido." };
    }

    if (!normalizedContent) {
      return { success: false, error: "Mensagem vazia." };
    }

    const receiver = await db.user.findUnique({
      where: { id: receiverId },
      select: {
        id: true,
        userType: true,
        industry: true,
        isActive: true,
      },
    });

    if (!receiver || !receiver.isActive || receiver.industry !== "TECH") {
      return {
        success: false,
        error: "Usuario de Tecnologia nao encontrado.",
      };
    }

    let conversation = await db.conversation.findFirst({
      where: {
        OR: [
          { participantAId: senderId, participantBId: receiverId },
          { participantAId: receiverId, participantBId: senderId },
        ],
      },
    });

    if (!conversation) {
      const receiverIsPublicTechProfessional =
        receiver.userType === "PROFESSIONAL" && receiver.industry === "TECH";
      const hasSharedContext = await hasSharedTechContext(senderId, receiverId);

      if (!receiverIsPublicTechProfessional && !hasSharedContext) {
        return {
          success: false,
          error:
            "Conversa permitida apenas com profissional Tech ou usuarios com projeto/proposta em comum.",
        };
      }

      conversation = await db.conversation.create({
        data: {
          participantAId: senderId,
          participantBId: receiverId,
          lastMessage: normalizedContent,
          lastMessageTime: new Date(),
          unreadCountA: 0,
          unreadCountB: 1,
          deletedByIds: [],
        },
      });
    } else {
      const isSenderA = conversation.participantAId === senderId;

      await db.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: normalizedContent,
          lastMessageTime: new Date(),
          unreadCountA: isSenderA
            ? conversation.unreadCountA
            : { increment: 1 },
          unreadCountB: !isSenderA
            ? conversation.unreadCountB
            : { increment: 1 },
          deletedByIds: [],
        },
      });
    }

    const newMessage = await db.message.create({
      data: {
        content: normalizedContent,
        senderId,
        conversationId: conversation.id,
      },
    });

    revalidatePath("/dashboard/chat");
    return { success: true, data: newMessage };
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return { success: false, error: "Erro ao enviar mensagem." };
  }
}
