import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ClientDashboardView from "./ClientDashboardView";
import { verifySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getDashboardStats(userId: string) {
  const [unreadMessages, openProjects, ongoingProjects] = await Promise.all([
    db.message.count({
      where: {
        read: false,
        senderId: { not: userId },
        conversation: {
          OR: [{ participantAId: userId }, { participantBId: userId }],
          NOT: { deletedByIds: { has: userId } },
        },
      },
    }),
    db.project.count({ where: { ownerId: userId, status: "OPEN" } }),
    db.project.count({ where: { ownerId: userId, status: "IN_PROGRESS" } }),
  ]);

  return { unreadMessages, openProjects, ongoingProjects };
}

export default async function ClienteDashboardPage() {
  const session = await verifySession();
  if (!session || !session.sub) redirect("/login");

  const userId = session.sub as string;

  // --- BUSCA OTIMIZADA ---
  const [stats, user] = await Promise.all([
    getDashboardStats(userId),
    db.user.findUnique({
      where: { id: userId },
    }),
  ]);

  if (!user) redirect("/login");

  const isProfileIncomplete = !user.city || !user.state;

  // --- A CORREÇÃO MÁGICA ---
  // Removemos o peso morto da imagem antes de enviar para o cliente
  const userSafe = {
    ...user,
    profileImageBytes: undefined, // <--- Remove os dados binários pesados
    // Se quiser que a foto apareça no header/dashboard, gere a URL igual fizemos no perfil:
    avatarUrl: user.profileImageBytes
      ? `/api/images/user/${user.id}?t=${user.updatedAt.getTime()}`
      : null,
  };

  return (
    <ClientDashboardView
      stats={stats}
      isProfileIncomplete={isProfileIncomplete}
      user={userSafe} // Passamos o usuário "leve"
    />
  );
}
