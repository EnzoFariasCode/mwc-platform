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
  if (!session?.sub) redirect("/login");

  const userId = session.sub;

  const [stats, user] = await Promise.all([
    getDashboardStats(userId),
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        userType: true,
        industry: true,
        city: true,
        state: true,
        profileImageBytes: true,
        updatedAt: true,
      },
    }),
  ]);

  if (!user) redirect("/login");

  const isProfileIncomplete = !user.city || !user.state;
  const userSafe = {
    id: user.id,
    name: user.name,
    displayName: user.displayName,
    email: user.email,
    userType: user.userType,
    industry: user.industry,
    city: user.city,
    state: user.state,
    avatarUrl: user.profileImageBytes
      ? `/api/images/user/${user.id}?t=${user.updatedAt.getTime()}`
      : null,
  };

  return (
    <ClientDashboardView
      stats={stats}
      isProfileIncomplete={isProfileIncomplete}
      user={userSafe}
    />
  );
}
