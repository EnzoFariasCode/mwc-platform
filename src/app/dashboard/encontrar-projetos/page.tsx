import { db } from "@/lib/prisma";
import ProjectListView from "./ProjectListView"; // Vamos criar essa view

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
        },
      },
    },
  });

  return <ProjectListView initialProjects={projects} />;
}
