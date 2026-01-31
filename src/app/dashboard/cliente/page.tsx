import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation"; // <--- Importante para o "kick"
import ClientDashboardView from "./ClientDashboardView";
import { verifySession } from "@/lib/auth";

// Função para buscar os contadores reais
async function getDashboardStats(userId: string) {
  const [unreadMessages, openProjects, ongoingProjects] = await Promise.all([
    // 1. Mensagens não lidas
    db.message.count({
      where: {
        read: false,
        senderId: { not: userId },
        conversation: {
          OR: [{ participantAId: userId }, { participantBId: userId }],
        },
      },
    }),

    // 2. Projetos Abertos
    db.project.count({
      where: {
        ownerId: userId,
        status: "OPEN",
      },
    }),

    // 3. Projetos em Andamento
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
  const token = cookieStore.get("session")?.value;

  // --- 🔒 VALIDAÇÃO FORTE (GOLDEN RULE) ---

  // 1. Se não tem token, tchau.
  if (!token) {
    redirect("/login");
  }

  // 2. Tenta validar o token real
  const session = await verifySession(token);

  // 3. Se o token for inválido, expirado ou não tiver ID, tchau.
  if (!session || !session.sub) {
    redirect("/login");
  }

  const userId = session.sub as string;

  // --- 🚀 DADOS REAIS (Só executa se passou na segurança acima) ---

  // 1. Busca estatísticas
  const stats = await getDashboardStats(userId);

  // 2. Busca dados para verificar se o perfil está completo
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { city: true, state: true },
  });

  // Se faltar cidade ou estado, marca como incompleto
  const isProfileIncomplete = !user?.city || !user?.state;

  return (
    <ClientDashboardView
      stats={stats}
      isProfileIncomplete={isProfileIncomplete}
    />
  );
}
