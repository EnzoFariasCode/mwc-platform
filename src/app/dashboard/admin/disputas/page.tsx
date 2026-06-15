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
      where: { status: "DISPUTE" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        agreedPrice: true,
        updatedAt: true,
        deliverables: {
          where: {
            description: {
              startsWith: "DISPUTE_OPENED",
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
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
      where: { status: "DISPUTED" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        date: true,
        time: true,
        price: true,
        status: true,
        disputeReason: true,
        disputeOpenedAt: true,
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
    ...techProjects.map((project) => ({
      id: project.id,
      kind: "TECH" as const,
      title: project.title,
      status: project.status,
      amount: project.agreedPrice ? project.agreedPrice.toNumber() : null,
      reason:
        project.deliverables[0]?.description?.replace(
          /^DISPUTE_OPENED\s*-\s*/,
          "",
        ) ?? null,
      openedAt: project.deliverables[0]?.createdAt.toISOString() ?? null,
      updatedAt: project.updatedAt.toISOString(),
      requesterLabel: "Cliente" as const,
      requesterName: project.owner.name || "Cliente",
      requesterEmail: project.owner.email,
      professionalName: project.professional?.name || "Profissional",
      professionalEmail: project.professional?.email ?? null,
    })),
    ...healthAppointments.map((appointment) => ({
      id: appointment.id,
      kind: "HEALTH" as const,
      title: `Consulta em ${appointment.date.toLocaleDateString("pt-BR")} as ${
        appointment.time
      }`,
      status: appointment.status,
      amount: appointment.price.toNumber(),
      reason: appointment.disputeReason,
      openedAt: appointment.disputeOpenedAt?.toISOString() ?? null,
      updatedAt: appointment.updatedAt.toISOString(),
      requesterLabel: "Paciente" as const,
      requesterName: appointment.patient.name || "Paciente",
      requesterEmail: appointment.patient.email,
      professionalName: appointment.professional.name || "Profissional",
      professionalEmail: appointment.professional.email,
    })),
  ].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <PageContainer>
      <AdminDisputesView disputes={disputes} />
    </PageContainer>
  );
}
