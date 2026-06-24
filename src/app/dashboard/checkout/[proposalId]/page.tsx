import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import CheckoutView from "./CheckoutView"; // Importa o arquivo visual novo

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const session = await verifySession();

  if (!session || !session.sub) {
    redirect("/login");
  }

  const { proposalId } = await params;
  const userId = session.sub as string;

  // Busca a Proposta com os dados do Projeto e do Profissional
  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: {
        select: { title: true, ownerId: true },
      },
      professional: {
        select: { name: true },
      },
    },
  });

  if (!proposal) {
    notFound();
  }

  if (session.userType === "ADMIN" || proposal.project.ownerId !== userId) {
    notFound();
  }

  // Passa os dados reais para o componente visual
  return (
    <CheckoutView
      proposalId={proposal.id}
      projectTitle={proposal.project.title}
      professionalName={proposal.professional.name || "Profissional MWC"}
      price={Number(proposal.price)} // Converte Decimal para Number
    />
  );
}
