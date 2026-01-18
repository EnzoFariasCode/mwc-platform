import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MyProposalsView from "./MyProposalsView"; // <--- Importa a View correta que criamos

export default async function MinhasPropostasPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  if (!session || !session.sub) {
    redirect("/login");
  }

  const userId = session.sub as string;

  // Busca propostas que EU ENVIEI (Profissional)
  const proposals = await db.proposal.findMany({
    where: {
      professionalId: userId,
      // Status que mostramos aqui (exceto Aceitas que vão para Projetos Ativos)
      status: {
        in: ["PENDING", "REJECTED", "WITHDRAWN"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return <MyProposalsView proposals={proposals} />;
}
