import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import CheckoutView from "./CheckoutView"; // Importa o arquivo visual novo
import { getPublicPaymentMethods } from "@/modules/stripe/services/payment-method-health";

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
        select: { title: true, ownerId: true, status: true },
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

  if (
    proposal.status !== "PENDING" ||
    !["OPEN", "WAITING_PAYMENT"].includes(proposal.project.status)
  ) {
    redirect("/dashboard/meus-projetos?proposalUnavailable=true");
  }

  const paymentMethods = await getPublicPaymentMethods();

  // Passa os dados reais para o componente visual
  return (
    <CheckoutView
      proposalId={proposal.id}
      projectTitle={proposal.project.title}
      professionalName={proposal.professional.name || "Profissional MWC"}
      price={Number(proposal.price)} // Converte Decimal para Number
      paymentMethods={paymentMethods}
    />
  );
}
