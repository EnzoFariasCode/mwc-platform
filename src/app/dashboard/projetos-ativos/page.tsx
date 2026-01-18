import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ActiveProjectsView from "./ActiveProjectsView";

export default async function ProjetosAtivosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  if (!session || !session.sub) {
    redirect("/login");
  }

  const userId = session.sub as string;

  // Busca projetos onde eu sou o Profissional E o status é "Ativo"
  const activeProjects = await db.project.findMany({
    where: {
      professionalId: userId, // Eu fui o contratado
      status: {
        in: ["IN_PROGRESS", "WAITING_PAYMENT", "UNDER_REVIEW", "DISPUTE"],
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      owner: {
        // O Cliente
        select: {
          id: true,
          name: true,
          // avatarUrl: true // Se tiver no futuro
        },
      },
    },
  });

  return (
    <ActiveProjectsView projects={activeProjects} currentUserId={userId} />
  );
}
