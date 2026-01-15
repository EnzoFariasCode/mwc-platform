import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MyProjectsView from "./MyProjectsView";
import { verifySession } from "@/lib/auth"; // <--- Importante

export default async function MeusProjetosPage() {
  const cookieStore = await cookies();

  // 1. LÓGICA NOVA DE AUTH (JWT)
  const token = cookieStore.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  // 2. Se não tiver sessão válida, redireciona
  if (!session || !session.sub) {
    redirect("/login");
  }

  const userId = session.sub as string; // O ID real vem do token

  // 3. Busca projetos criados por este usuário
  const myProjects = await db.project.findMany({
    where: {
      ownerId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      professional: {
        select: {
          name: true,
        },
      },
    },
  });

  return <MyProjectsView initialProjects={myProjects} />;
}
