import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MyProjectsView from "./MyProjectsView";
import { verifySession } from "@/lib/auth";

export default async function MeusProjetosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  if (!session || !session.sub) {
    redirect("/login");
  }

  const userId = session.sub as string;

  const myProjects = await db.project.findMany({
    where: {
      ownerId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      professional: {
        select: { name: true },
      },
      // 👇 ADICIONE ISSO AQUI (Conta as propostas recebidas)
      _count: {
        select: { proposals: true },
      },
    },
  });

  return <MyProjectsView initialProjects={myProjects} />;
}
