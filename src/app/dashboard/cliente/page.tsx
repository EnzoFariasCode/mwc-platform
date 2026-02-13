import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ClientDashboardView from "./ClientDashboardView";
import { verifySession } from "@/lib/auth";

async function getDashboardStats(userId: string) {
  // --- DEBUG: Vamos isolar as queries para achar o erro ---

  // 1. Projetos Abertos (Query Simples)
  const openProjects = await db.project.count({
    where: { ownerId: userId, status: "OPEN" },
  });

  // 2. Projetos em Andamento (Query Simples)
  const ongoingProjects = await db.project.count({
    where: { ownerId: userId, status: "IN_PROGRESS" },
  });

  // 3. Mensagens (Query Complexa - ALTA PROBABILIDADE DE ERRO AQUI)
  // Vou deixar como 0 temporariamente. Se a página abrir, o erro era aqui.
  const unreadMessages = 0;

  /* // CÓDIGO QUE PODE ESTAR QUEBRANDO (NOME DA RELAÇÃO):
  const unreadMessages = await db.message.count({
      where: {
        read: false,
        senderId: { not: userId },
        conversation: { // <--- Se no seu schema não se chamar 'conversation' (minúsculo), quebra.
          OR: [{ participantAId: userId }, { participantBId: userId }],
        },
      },
  });
  */

  return { unreadMessages, openProjects, ongoingProjects };
}

export default async function ClienteDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) redirect("/login");

  const session = await verifySession(token);
  if (!session || !session.sub) redirect("/login");

  const userId = session.sub as string;

  try {
    const stats = await getDashboardStats(userId);

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) redirect("/login");

    // Validação simples de perfil incompleto
    const isProfileIncomplete = !user.city || !user.state;

    return (
      <ClientDashboardView
        stats={stats}
        isProfileIncomplete={isProfileIncomplete}
        user={user}
      />
    );
  } catch (error) {
    console.error("ERRO CRÍTICO NO DASHBOARD:", error);
    // Retorna uma div de erro para não ficar tela branca
    return (
      <div className="p-8 text-white">
        <h1 className="text-xl font-bold text-red-500">
          Erro ao carregar Dashboard
        </h1>
        <p>Verifique o terminal para ver o erro detalhado do Prisma.</p>
      </div>
    );
  }
}
