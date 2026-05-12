"use server";

import { db } from "@/lib/prisma";
import { getUserSession } from "@/lib/get-session";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ActionResponse } from "@/modules/users/types/user-types";

type NotificationItem = {
  id: string | number;
  type: "message" | "success" | "warning" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
};

export async function getNotifications(): Promise<
  ActionResponse<NotificationItem[]>
> {
  const session = await getUserSession();

  if (!session?.id) {
    return { success: false, error: "Não autorizado." };
  }

  const userId = session.id;
  const userRole = session.role; // Assumindo que a role vem na sessão (CLIENT / PROFESSIONAL)
  const notifications: NotificationItem[] = [];
  let idCounter = 1;

  // 1. MENSAGENS NÃO LIDAS (Comum a ambos)
  const conversations = await db.conversation.findMany({
    where: {
      OR: [
        { participantAId: userId, unreadCountA: { gt: 0 } },
        { participantBId: userId, unreadCountB: { gt: 0 } },
      ],
    },
    include: {
      participantA: { select: { name: true } },
      participantB: { select: { name: true } },
    },
  });

  conversations.forEach((conv) => {
    const senderName =
      conv.participantAId === userId
        ? conv.participantB.name
        : conv.participantA.name;
    notifications.push({
      id: `msg-${conv.id}`,
      type: "message",
      title: "Nova Mensagem",
      message: `${senderName} enviou uma mensagem para você.`,
      time: formatDistanceToNow(conv.lastMessageTime, {
        addSuffix: true,
        locale: ptBR,
      }),
      read: false,
      link: `/dashboard/chat?id=${conv.id}`,
    });
  });

  // --- LÓGICA ESPECÍFICA PARA CLIENTE ---
  if (userRole === "CLIENT") {
    // A) Projetos com novas propostas
    const projectsWithBids = await db.project.findMany({
      where: { ownerId: userId, status: "OPEN", bidsCount: { gt: 0 } },
      select: { id: true, title: true, bidsCount: true, updatedAt: true },
    });

    projectsWithBids.forEach((proj) => {
      notifications.push({
        id: `bid-${proj.id}`,
        type: "info",
        title: "Propostas Recebidas",
        message: `Você recebeu propostas (${proj.bidsCount}) para o projeto "${proj.title}".`,
        time: formatDistanceToNow(proj.updatedAt, {
          addSuffix: true,
          locale: ptBR,
        }),
        read: false,
        link: `/dashboard/meus-projetos`,
      });
    });

    // B) Projetos aguardando aprovação (Entrega feita pelo profissional)
    const projectsToApprove = await db.project.findMany({
      where: { ownerId: userId, status: "UNDER_REVIEW" },
      select: { id: true, title: true, updatedAt: true },
    });

    projectsToApprove.forEach((proj) => {
      notifications.push({
        id: `review-${proj.id}`,
        type: "warning",
        title: "Aprovação Necessária",
        message: `O projeto "${proj.title}" foi entregue. Verifique para liberar o pagamento.`,
        time: formatDistanceToNow(proj.updatedAt, {
          addSuffix: true,
          locale: ptBR,
        }),
        read: false,
        link: `/dashboard/meus-projetos`,
      });
    });
  }

  // --- LÓGICA ESPECÍFICA PARA PROFISSIONAL ---
  if (userRole === "PROFESSIONAL") {
    // A) Proposta aceita pelo cliente (Aguardando pagamento ou já em progresso)
    const activeProposals = await db.proposal.findMany({
      where: { professionalId: userId, status: "ACCEPTED" },
      include: {
        project: { select: { title: true, status: true, updatedAt: true } },
      },
    });

    activeProposals.forEach((prop) => {
      if (prop.project.status === "WAITING_PAYMENT") {
        notifications.push({
          id: `accepted-${prop.id}`,
          type: "success",
          title: "Proposta Aceita!",
          message: `O cliente aceitou sua proposta para "${prop.project.title}". Aguardando pagamento.`,
          time: formatDistanceToNow(prop.project.updatedAt, {
            addSuffix: true,
            locale: ptBR,
          }),
          read: false,
          link: `/dashboard/projetos-ativos`,
        });
      } else if (prop.project.status === "IN_PROGRESS") {
        notifications.push({
          id: `paid-${prop.id}`,
          type: "success",
          title: "Pagamento Confirmado",
          message: `O cliente pagou por "${prop.project.title}". O valor será liberado na conclusão.`,
          time: formatDistanceToNow(prop.project.updatedAt, {
            addSuffix: true,
            locale: ptBR,
          }),
          read: false,
          link: `/dashboard/projetos-ativos`,
        });
      }
    });

    // B) Saldo disponível na carteira
    const prof = await db.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (prof && Number(prof.walletBalance) > 0) {
      notifications.push({
        id: `balance-${userId}`,
        type: "success",
        title: "Valor Disponível",
        message: `R$ ${Number(prof.walletBalance).toFixed(2)} já estão disponíveis na sua carteira.`,
        time: "Agora",
        read: false,
        link: `/dashboard/financeiro`,
      });
    }
  }

  return { success: true, data: notifications };
}
