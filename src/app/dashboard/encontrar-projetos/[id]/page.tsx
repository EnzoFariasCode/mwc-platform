import { db } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import ProjectDetailsView from "./ProjectDetailsView";

// Página Dinâmica do Servidor
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. Verifica sessão (Segurança básica)
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) redirect("/login");

  // 2. Resolve os params (Next.js 15)
  const { id } = await params;

  // 3. Busca o projeto com dados do dono
  const project = await db.project.findUnique({
    where: { id: id },
    include: {
      owner: {
        select: {
          id: true, // Importante para o Chat
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

  // 4. Passa os dados reais para o componente visual
  return <ProjectDetailsView project={project} />;
}
