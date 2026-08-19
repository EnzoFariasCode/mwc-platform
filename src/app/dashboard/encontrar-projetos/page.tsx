import { db } from "@/lib/prisma";
import ProjectListView from "./ProjectListView"; // Vamos criar essa view

export const dynamic = "force-dynamic";

// Server Component: Busca os dados
export default async function EncontrarProjetosPage() {
  const projects = await db.project.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        // Inclui dados do dono do projeto (localização, etc)
        select: {
          city: true,
          state: true,
          rating: true, // Se tiver rating de cliente
          ratingCount: true,
        },
      },
    },
  });

  const safeProjects = projects.map((project) => ({
    ...project,
    // Links legados sao privados e nunca devem chegar ao navegador publico.
    attachments: [],
    budgetValue: project.budgetValue.toNumber(),
  }));

  return <ProjectListView initialProjects={safeProjects} />;
}
