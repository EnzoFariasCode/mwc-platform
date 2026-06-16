import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { Prisma, ProjectStatus } from "@prisma/client";
import AdminDisputesView, { AdminDisputeItem } from "./AdminDisputesView";

type TechDisputeRecord = {
  id: string;
  title: string;
  status: ProjectStatus;
  agreedPrice: Prisma.Decimal | null;
  disputeReason: string | null;
  disputeOpenedAt: Date | null;
  disputeResolvedAt: Date | null;
  disputeResolution: string | null;
  updatedAt: Date;
  deliverables: Array<{
    description: string | null;
    createdAt: Date;
  }>;
  owner: {
    name: string | null;
    email: string | null;
  };
  professional: {
    name: string | null;
    email: string | null;
  } | null;
};

export default async function AdminDisputasPage() {
  await requireAdminUser();

  const [techProjects, healthAppointments] = await Promise.all([
    db.project.findMany({
      where: {
        OR: [
          { status: "DISPUTE" },
          { disputeOpenedAt: { not: null } },
          {
            deliverables: {
              some: {
                description: {
                  startsWith: "DISPUTE_",
                },
              },
            },
          },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        status: true,
        agreedPrice: true,
        disputeReason: true,
        disputeOpenedAt: true,
        disputeResolvedAt: true,
        disputeResolution: true,
        updatedAt: true,
        deliverables: {
          where: {
            OR: [
              { description: { startsWith: "DISPUTE_OPENED" } },
              { description: { startsWith: "DISPUTE_RESOLVED" } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            description: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        professional: {
          select: {
            name: true,
            email: true,
          },
        },
      } as Prisma.ProjectSelect,
    }) as Promise<TechDisputeRecord[]>,
    db.appointment.findMany({
      where: {
        OR: [
          { status: "DISPUTED" },
          { notes: { contains: "DISPUTE_RESOLVED" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        date: true,
        time: true,
        price: true,
        status: true,
        disputeReason: true,
        disputeOpenedAt: true,
        notes: true,
        updatedAt: true,
        patient: {
          select: {
            name: true,
            email: true,
          },
        },
        professional: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const disputes: AdminDisputeItem[] = [
    ...techProjects.map((project) => {
      const opened = project.deliverables.find((item) =>
        item.description?.startsWith("DISPUTE_OPENED"),
      );
      const resolved = project.deliverables.find((item) =>
        item.description?.startsWith("DISPUTE_RESOLVED"),
      );
      const resolvedDescription = resolved?.description ?? "";
      const resolution: AdminDisputeItem["resolution"] =
        resolvedDescription.startsWith("DISPUTE_RESOLVED_REFUND") ||
        project.disputeResolution?.includes("Resultado: LOST")
          ? "REFUND"
          : resolvedDescription.startsWith("DISPUTE_RESOLVED_RELEASE") ||
              project.disputeResolution?.includes("Resultado: WON")
            ? "RELEASE"
            : null;

      return {
        id: project.id,
        kind: "TECH" as const,
        title: project.title,
        status: project.status,
        amount: project.agreedPrice ? project.agreedPrice.toNumber() : null,
        reason:
          opened?.description?.replace(/^DISPUTE_OPENED\s*-\s*/, "") ??
          project.disputeReason,
        resolutionReason:
          resolvedDescription.replace(
            /^DISPUTE_RESOLVED_(REFUND|RELEASE)\s*-\s*/,
            "",
          ) ||
          project.disputeResolution,
        resolution,
        isOpen: project.status === "DISPUTE",
        openedAt:
          opened?.createdAt.toISOString() ??
          project.disputeOpenedAt?.toISOString() ??
          null,
        resolvedAt:
          resolved?.createdAt.toISOString() ??
          project.disputeResolvedAt?.toISOString() ??
          null,
        updatedAt: project.updatedAt.toISOString(),
        requesterLabel: "Cliente" as const,
        requesterName: project.owner.name || "Cliente",
        requesterEmail: project.owner.email,
        professionalName: project.professional?.name || "Profissional",
        professionalEmail: project.professional?.email ?? null,
      };
    }),
    ...healthAppointments.map((appointment) => {
      const notes = appointment.notes ?? "";
      const resolution: AdminDisputeItem["resolution"] = notes.includes(
        "DISPUTE_RESOLVED_REFUND",
      )
        ? "REFUND"
        : notes.includes("DISPUTE_RESOLVED_RELEASE")
          ? "RELEASE"
          : null;
      const resolutionReason =
        notes
          .match(/Motivo:\s*([^.\n]+)/)?.[1]
          ?.trim() || null;

      return {
        id: appointment.id,
        kind: "HEALTH" as const,
        title: `Consulta em ${appointment.date.toLocaleDateString("pt-BR")} as ${
          appointment.time
        }`,
        status: appointment.status,
        amount: appointment.price.toNumber(),
        reason: appointment.disputeReason,
        resolutionReason,
        resolution,
        isOpen: appointment.status === "DISPUTED",
        openedAt: appointment.disputeOpenedAt?.toISOString() ?? null,
        resolvedAt: resolution ? appointment.updatedAt.toISOString() : null,
        updatedAt: appointment.updatedAt.toISOString(),
        requesterLabel: "Paciente" as const,
        requesterName: appointment.patient.name || "Paciente",
        requesterEmail: appointment.patient.email,
        professionalName: appointment.professional.name || "Profissional",
        professionalEmail: appointment.professional.email,
      };
    }),
  ].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <PageContainer>
      <AdminDisputesView disputes={disputes} />
    </PageContainer>
  );
}
