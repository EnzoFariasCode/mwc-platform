import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MyProjectsView from "./MyProjectsView";
import { verifySession } from "@/lib/auth";
import { confirmProjectPayment } from "@/modules/stripe/actions/confirm-project-payment";

export default async function MeusProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await verifySession();

  if (!session || !session.sub) {
    redirect("/login");
  }

  const userId = session.sub as string;

  // Lê a URL para ver se o pagamento acabou de ser feito
  const resolvedParams = await searchParams;
  const isSuccessPayment = resolvedParams.success === "true";
  const sessionId =
    typeof resolvedParams.session_id === "string"
      ? resolvedParams.session_id
      : undefined;

  let isPaymentConfirmed = isSuccessPayment;
  if (isSuccessPayment && sessionId) {
    const confirmResult = await confirmProjectPayment(sessionId);
    isPaymentConfirmed = confirmResult.success;
  }

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
      // Conta as propostas recebidas
      _count: {
        select: { proposals: true },
      },
      //TRÁS O LINK E A MENSAGEM DA ENTREGA
      deliverables: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <MyProjectsView
      initialProjects={myProjects}
      isSuccessPayment={isPaymentConfirmed}
    />
  );
}
