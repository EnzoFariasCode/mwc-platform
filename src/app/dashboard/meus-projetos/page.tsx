import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MyProjectsView from "./MyProjectsView";
import { verifySession } from "@/lib/auth";
import { confirmProjectPayment } from "@/modules/stripe/actions/confirm-project-payment";
import {
  canCancelPaidTechProject,
  getTechProjectCancellationDeadline,
} from "@/modules/projects/lib/tech-project-cancellation";

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
  const isProposalUnavailable =
    resolvedParams.proposalUnavailable === "true";
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
        select: {
          proposals: {
            where: { status: "PENDING" },
          },
        },
      },
      //TRÁS O LINK E A MENSAGEM DA ENTREGA
      deliverables: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const completedHolds = await db.projectCheckoutHold.findMany({
    where: {
      projectId: { in: myProjects.map((project) => project.id) },
      status: "COMPLETED",
      completedAt: { not: null },
    },
    orderBy: { completedAt: "desc" },
    select: {
      projectId: true,
      completedAt: true,
    },
  });

  const paymentConfirmedAtByProject = new Map<string, Date>();
  completedHolds.forEach((hold) => {
    if (
      hold.completedAt &&
      !paymentConfirmedAtByProject.has(hold.projectId)
    ) {
      paymentConfirmedAtByProject.set(hold.projectId, hold.completedAt);
    }
  });

  const safeProjects = myProjects.map((project) => {
    const paymentConfirmedAt = paymentConfirmedAtByProject.get(project.id);
    const cancellationDeadline = paymentConfirmedAt
      ? getTechProjectCancellationDeadline(paymentConfirmedAt)
      : null;

    return {
      ...project,
      budgetValue: project.budgetValue.toNumber(),
      agreedPrice: project.agreedPrice ? project.agreedPrice.toNumber() : null,
      paymentConfirmedAt: paymentConfirmedAt?.toISOString() ?? null,
      cancellationDeadlineAt: cancellationDeadline?.toISOString() ?? null,
      canCancelPaid:
        project.status === "IN_PROGRESS" &&
        Boolean(
          paymentConfirmedAt &&
            canCancelPaidTechProject(paymentConfirmedAt),
        ),
    };
  });

  return (
    <MyProjectsView
      initialProjects={safeProjects}
      isSuccessPayment={isPaymentConfirmed}
      isProposalUnavailable={isProposalUnavailable}
    />
  );
}
