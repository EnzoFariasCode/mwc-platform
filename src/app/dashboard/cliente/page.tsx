// --- PARTE 1: SERVER COMPONENT (Busca de Dados) ---
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import ClientDashboardView from "./ClientDashboardView";

// Função para buscar os contadores reais
async function getDashboardStats(userId: string) {
  const [unreadMessages, openProjects, ongoingProjects] = await Promise.all([
    // 1. Mensagens não lidas onde o destinatário é o usuário
    db.message.count({
      where: {
        receiverId: userId,
        read: false,
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
  const userId = cookieStore.get("userId")?.value;

  // Valores padrão caso não tenha ID (não deve acontecer devido ao middleware/layout)
  let stats = { unreadMessages: 0, openProjects: 0, ongoingProjects: 0 };

  if (userId) {
    stats = await getDashboardStats(userId);
  }

  // Passamos os dados reais para a View
  return <ClientDashboardView stats={stats} />;
}
