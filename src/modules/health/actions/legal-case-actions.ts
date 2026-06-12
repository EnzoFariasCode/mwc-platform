"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type LegalCaseSummary = {
  id: string;
  clientRecordId: string;
  title: string;
  legalArea: string | null;
  processNumber: string | null;
  court: string | null;
  clientPosition: string | null;
  opposingParty: string | null;
  opposingCounsel: string | null;
  factsSummary: string | null;
  feeType: string | null;
  feeDetails: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  activities: LegalCaseActivityItem[];
};

export type LegalCaseActivityItem = {
  id: string;
  legalCaseId: string;
  activityDate: Date;
  activityType: string;
  timeSpentMinutes: number | null;
  description: string;
  deadlineDate: Date | null;
  reminderDays: number | null;
  filesNotes: string | null;
  createdAt: Date;
};

type LegalCasePayload = {
  title: string;
  legalArea?: string;
  processNumber?: string;
  court?: string;
  clientPosition?: string;
  opposingParty?: string;
  opposingCounsel?: string;
  factsSummary?: string;
  feeType?: string;
  feeDetails?: string;
  status?: string;
};

type LegalActivityPayload = {
  activityDate: string;
  activityType: string;
  timeSpentMinutes?: number | null;
  description: string;
  deadlineDate?: string;
  reminderDays?: number | null;
  filesNotes?: string;
};

async function requireHealthProfessional() {
  const session = await auth();

  if (
    !session?.user?.id ||
    session.user.userType !== "PROFESSIONAL" ||
    session.user.industry !== "HEALTH"
  ) {
    return null;
  }

  return session.user.id;
}

function parseOptionalDateOnly(value?: string) {
  if (!value) return null;

  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "INVALID" : date;
}

export async function listLegalCases(clientRecordId: string): Promise<{
  success: boolean;
  error?: string;
  cases?: LegalCaseSummary[];
}> {
  try {
    const professionalId = await requireHealthProfessional();
    if (!professionalId) return { success: false, error: "Nao autorizado." };

    const record = await db.clientRecord.findUnique({
      where: { id: clientRecordId },
      select: { professionalId: true, specialty: true },
    });

    if (
      !record ||
      record.professionalId !== professionalId ||
      record.specialty !== "LAWYER"
    ) {
      return { success: false, error: "Prontuario juridico nao encontrado." };
    }

    const cases = await db.legalCase.findMany({
      where: { clientRecordId, professionalId },
      orderBy: { updatedAt: "desc" },
      include: {
        activities: {
          orderBy: { activityDate: "desc" },
        },
      },
    });

    return { success: true, cases };
  } catch (error) {
    console.error("[LIST_LEGAL_CASES]", error);
    return { success: false, error: "Erro ao carregar casos juridicos." };
  }
}

export async function createLegalCase(
  clientRecordId: string,
  data: LegalCasePayload,
): Promise<{ success: boolean; error?: string; caseId?: string }> {
  try {
    const professionalId = await requireHealthProfessional();
    if (!professionalId) return { success: false, error: "Nao autorizado." };

    const record = await db.clientRecord.findUnique({
      where: { id: clientRecordId },
      select: { professionalId: true, patientId: true, specialty: true },
    });

    if (
      !record ||
      record.professionalId !== professionalId ||
      record.specialty !== "LAWYER"
    ) {
      return { success: false, error: "Prontuario juridico nao encontrado." };
    }

    if (!data.title || data.title.trim().length < 3) {
      return { success: false, error: "Informe o titulo interno do caso." };
    }

    const legalCase = await db.legalCase.create({
      data: {
        clientRecordId,
        professionalId,
        title: data.title.trim(),
        legalArea: data.legalArea?.trim() || null,
        processNumber: data.processNumber?.trim() || null,
        court: data.court?.trim() || null,
        clientPosition: data.clientPosition?.trim() || null,
        opposingParty: data.opposingParty?.trim() || null,
        opposingCounsel: data.opposingCounsel?.trim() || null,
        factsSummary: data.factsSummary?.trim() || null,
        feeType: data.feeType?.trim() || null,
        feeDetails: data.feeDetails?.trim() || null,
        status: data.status || "ACTIVE",
      },
    });

    revalidateLegalPaths(record.patientId);

    return { success: true, caseId: legalCase.id };
  } catch (error) {
    console.error("[CREATE_LEGAL_CASE]", error);
    return { success: false, error: "Erro ao criar caso juridico." };
  }
}

export async function createLegalCaseActivity(
  legalCaseId: string,
  data: LegalActivityPayload,
): Promise<{ success: boolean; error?: string; activityId?: string }> {
  try {
    const professionalId = await requireHealthProfessional();
    if (!professionalId) return { success: false, error: "Nao autorizado." };

    const legalCase = await db.legalCase.findUnique({
      where: { id: legalCaseId },
      select: {
        professionalId: true,
        clientRecord: { select: { patientId: true, specialty: true } },
      },
    });

    if (
      !legalCase ||
      legalCase.professionalId !== professionalId ||
      legalCase.clientRecord.specialty !== "LAWYER"
    ) {
      return { success: false, error: "Caso juridico nao encontrado." };
    }

    if (!data.activityType) {
      return { success: false, error: "Selecione o tipo de atividade." };
    }

    if (!data.description || data.description.trim().length < 10) {
      return {
        success: false,
        error: "Descreva o andamento com pelo menos 10 caracteres.",
      };
    }

    const activityDate = new Date(data.activityDate);
    if (Number.isNaN(activityDate.getTime())) {
      return { success: false, error: "Data da atividade invalida." };
    }

    if (
      data.timeSpentMinutes !== null &&
      data.timeSpentMinutes !== undefined &&
      (!Number.isInteger(data.timeSpentMinutes) || data.timeSpentMinutes < 0)
    ) {
      return { success: false, error: "Tempo gasto invalido." };
    }

    if (
      data.reminderDays !== null &&
      data.reminderDays !== undefined &&
      (!Number.isInteger(data.reminderDays) || data.reminderDays < 0)
    ) {
      return { success: false, error: "Lembrete interno invalido." };
    }

    const deadlineDate = parseOptionalDateOnly(data.deadlineDate);

    if (deadlineDate === "INVALID") {
      return { success: false, error: "Prazo fatal invalido." };
    }

    const activity = await db.legalCaseActivity.create({
      data: {
        legalCaseId,
        professionalId,
        activityDate,
        activityType: data.activityType,
        timeSpentMinutes: data.timeSpentMinutes ?? null,
        description: data.description.trim(),
        deadlineDate,
        reminderDays: data.reminderDays ?? null,
        filesNotes: data.filesNotes?.trim() || null,
      },
    });

    await db.legalCase.update({
      where: { id: legalCaseId },
      data: { updatedAt: new Date() },
    });

    revalidateLegalPaths(legalCase.clientRecord.patientId);

    return { success: true, activityId: activity.id };
  } catch (error) {
    console.error("[CREATE_LEGAL_CASE_ACTIVITY]", error);
    return { success: false, error: "Erro ao registrar andamento." };
  }
}

function revalidateLegalPaths(patientId: string) {
  revalidatePath(`/agendar-consulta/prontuario/${patientId}`);
  revalidatePath("/agendar-consulta/prontuarios");
  revalidatePath("/agendar-consulta/dashboard-profissional");
}
