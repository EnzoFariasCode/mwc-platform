import { db } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import ProjectDetailsView from "./ProjectDetailsView";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  if (!session || !session.sub) redirect("/login");

  const userId = session.sub as string; // <--- PEGUEI SEU ID AQUI
  const { id } = await params;

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

  // AGORA PASSO O "currentUserId" PARA A VIEW
  return <ProjectDetailsView project={project} currentUserId={userId} />;
}
