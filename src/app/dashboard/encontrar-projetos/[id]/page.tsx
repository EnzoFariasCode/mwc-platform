import { db } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import ProjectDetailsView from "./ProjectDetailsView";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await verifySession();

  if (!session || !session.sub) redirect("/login");

  const userId = session.sub as string;
  const { id } = await params;

  // 1. Busca os dados do Projeto
  const project = await db.project.findUnique({
    where: { id: id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          rating: true,
          createdAt: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // 2. Verifica se EU já enviei uma proposta para este projeto
  const myProposal = await db.proposal.findFirst({
    where: {
      projectId: id,
      professionalId: userId,
    },
    select: { id: true }, // Só precisamos saber se existe (ID basta)
  });

  const hasProposed = !!myProposal; // Converte para boolean (true/false)

  // 3. Passa tudo para a View
  return (
    <ProjectDetailsView
      project={project}
      currentUserId={userId}
      hasProposed={hasProposed}
    />
  );
}
