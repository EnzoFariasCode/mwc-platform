import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import ClientDashboardView from "./ClientDashboardView";
import { verifySession } from "@/lib/auth";

// Função para buscar os contadores reais
async function getDashboardStats(userId: string) {
  const [unreadMessages, openProjects, ongoingProjects] = await Promise.all([
    // 1. CORREÇÃO AQUI: Mensagens não lidas
    // Como removemos receiverId, a lógica agora é:
    // "Mensagens que NÃO fui eu que mandei, dentro de conversas que eu participo"
    db.message.count({
      where: {
        read: false,
        senderId: { not: userId }, // Não fui eu que enviei
        conversation: {
          participants: {
            some: { id: userId }, // Mas eu participo da conversa
          },
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

  if (userId) {
    stats = await getDashboardStats(userId);
  }

  // Passamos os dados reais para a View
  return <ClientDashboardView stats={stats} />;
}
