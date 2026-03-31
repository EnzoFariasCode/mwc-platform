"use server";

import { db } from "@/lib/prisma";
import { getUserSession } from "@/lib/get-session";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ActionResponse } from "@/modules/users/types/user-types";

type NotificationItem = {
  id: number;
  type: string;
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
    return { success: false, error: "Nao autorizado." };
  }

  const userId = session.id;
  const notifications = [];
  let idCounter = 1; // Apenas para o React usar como 'key'

  // 1. CHECAGEM DE MENSAGENS NÃO LIDAS
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
    const isParticipantA = conv.participantAId === userId;
    const senderName = isParticipantA
      ? conv.participantB.name
      : conv.participantA.name;

    notifications.push({
      id: idCounter++,
      type: "message",
      title: "Nova Mensagem",
      message: `${senderName} enviou uma nova mensagem.`,
      time: formatDistanceToNow(conv.lastMessageTime, {
        addSuffix: true,
        locale: ptBR,
      }),
      read: false, // É não lida porque filtramos por unreadCount > 0
      link: `/dashboard/chat?id=${conv.id}`,
    });
  });

  // 2. CHECAGEM DE PROPOSTAS ACEITAS (Aguardando Pagamento ou Em Progresso)
  // Se o usuário for PROFISSIONAL e tiver propostas aceitas recentemente
  const acceptedProposals = await db.proposal.findMany({
    where: {
      professionalId: userId,
      status: "ACCEPTED",
    },
    include: { project: { select: { title: true } } },
    orderBy: { updatedAt: "desc" },
    take: 3, // Pega as 3 mais recentes para não lotar
  });

  acceptedProposals.forEach((prop) => {
    notifications.push({
      id: idCounter++,
      type: "success",
      title: "Proposta Aceita!",
      message: `Sua proposta para o projeto "${prop.project.title}" foi aceita.`,
      time: formatDistanceToNow(prop.updatedAt, {
        addSuffix: true,
        locale: ptBR,
      }),
      read: false,
      link: `/dashboard/meus-projetos`,
    });
  });

  // 3. CHECAGEM DE SALDO (Dinheiro em conta)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true },
  });

  if (user && user.walletBalance.greaterThan(0)) {
    notifications.push({
      id: idCounter++,
      type: "success",
      title: "Saldo Disponível",
      message: `Você tem R$ ${user.walletBalance.toFixed(2)} disponíveis para saque.`,
      time: "Agora",
      read: false,
      link: `/dashboard/financeiro`,
    });
  }

  // 4. CHECAGEM DE PERFIL INCOMPLETO (Exemplo de Warning)
  const profileCheck = await db.user.findUnique({
    where: { id: userId },
    select: { userType: true, jobTitle: true, skills: true },
  });

  if (
    profileCheck?.userType === "PROFESSIONAL" &&
    (!profileCheck.jobTitle || profileCheck.skills.length === 0)
  ) {
    notifications.push({
      id: idCounter++,
      type: "warning",
      title: "Complete seu Perfil",
      message:
        "Adicione sua especialidade e habilidades para ser encontrado por clientes.",
      time: "Importante",
      read: false,
      link: `/dashboard/perfil`,
    });
  }

  // Ordena por "ID" inverso (ou poderia ser por data real se tivéssemos um campo de data em todas)
  return { success: true, data: notifications.reverse() };
}
