import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProjectDetailsView from "./ProjectDetailsView";

// Correção: params agora é uma Promise<{ id: string }>
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. Aguardamos os parâmetros serem resolvidos
  const { id } = await params;

  // 2. Agora o 'id' é uma string válida, podemos chamar o banco
  const project = await db.project.findUnique({
    where: { id: id },
    include: {
      owner: {
        select: {
          name: true,
          city: true,
          state: true,
          rating: true,
          createdAt: true,
        },
      },
    },
  });

  // Se não achar (link quebrado ou id inválido), mostra 404
  if (!project) {
    notFound();
  }

  // Passa os dados reais para o componente visual
  return <ProjectDetailsView project={project} />;
}
