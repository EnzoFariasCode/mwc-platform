import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ActiveProjectsView from "./ActiveProjectsView";

export default async function ProjetosAtivosPage() {
  const session = await verifySession();

  if (!session || !session.sub) {
    redirect("/login");
  }

  const userId = session.sub as string;

  // Busca projetos onde eu sou o Profissional E o status é "Ativo"
  const activeProjects = await db.project.findMany({
    where: {
      professionalId: userId, // Eu fui o contratado
      OR: [
        {
          status: {
            in: ["IN_PROGRESS", "WAITING_PAYMENT", "UNDER_REVIEW", "DISPUTE"],
          },
        },
        {
          status: "COMPLETED",
          reviews: {
            none: {
              authorId: userId,
            },
          },
        },
      ],
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
      reviews: {
        where: { authorId: userId },
        select: { id: true },
      },
    },
  });

  const safeProjects = activeProjects.map((project) => ({
    ...project,
    budgetValue: project.budgetValue.toNumber(),
    agreedPrice: project.agreedPrice ? project.agreedPrice.toNumber() : null,
  }));

  return <ActiveProjectsView projects={safeProjects} />;
}
