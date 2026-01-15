import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import ClientDashboardView from "./ClientDashboardView";
import { verifySession } from "@/lib/auth";

// Função para buscar os contadores reais
async function getDashboardStats(userId: string) {
  // Executa as 3 consultas em paralelo para ser mais rápido
  const [unreadMessages, openProjects, ongoingProjects] = await Promise.all([
    // 1. Mensagens não lidas
    db.message.count({
      where: {
        read: false,
        senderId: { not: userId }, // Mensagem que NÃO fui eu que enviei
        conversation: {
          // Verifica se eu sou um dos participantes (A ou B)
          OR: [{ participantAId: userId }, { participantBId: userId }],
          // Opcional: Se quiser ignorar chats deletados, descomente abaixo:
          // NOT: {
          //   deletedByIds: { has: userId }
          // }
        },
      },
    }),

    // 2. Projetos criados pelo usuário que estão Abertos (OPEN)
    db.project.count({
      where: {
        ownerId: userId,
        status: "OPEN",
      },
    }),

    // 3. Projetos criados pelo usuário que estão em Andamento (IN_PROGRESS)
    db.project.count({
      where: {
        ownerId: userId,
        status: "IN_PROGRESS",
      },
    }),
  ]);

  return { unreadMessages, openProjects, ongoingProjects };
}

export default async function ClienteDashboardPage() {
  const cookieStore = await cookies();

  // LÓGICA NOVA DE AUTH (JWT)
  const token = cookieStore.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  // Se extrair o ID com sucesso, usamos ele. Se não, segue com stats zerados.
  const userId = session?.sub as string | undefined;

  // Valores padrão caso não tenha ID
  let stats = { unreadMessages: 0, openProjects: 0, ongoingProjects: 0 };
  let isProfileIncomplete = false; // <--- Variável nova para o Modal

  if (userId) {
    // 1. Busca estatísticas
    stats = await getDashboardStats(userId);

    // 2. Busca dados para verificar se o perfil está completo
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { city: true, state: true },
    });

    // Se faltar cidade ou estado, marca como incompleto
    if (!user?.city || !user?.state) {
      isProfileIncomplete = true;
    }
  }

  // Passamos os dados reais E a flag do perfil para a View
  return (
    <ClientDashboardView
      stats={stats}
      isProfileIncomplete={isProfileIncomplete}
    />
  );
}
