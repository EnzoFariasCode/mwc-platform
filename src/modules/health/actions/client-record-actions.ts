"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

// =========================================================
// TYPES
// =========================================================

type Specialty =
  | "PSYCHOLOGIST"
  | "NUTRITIONIST"
  | "PERSONAL_TRAINER"
  | "LAWYER"
  | "ENGLISH_TEACHER";

export type SessionNoteItem = {
  id: string;
  clientRecordId: string;
  appointmentId: string | null;
  sessionDate: Date;
  content: string;
  evolution: string | null;
  nextSteps: string | null;
  privateNotes: string | null;
  createdAt: Date;
};

export type ClientRecordResult = {
  success: boolean;
  error?: string;
  record?: {
    id: string;
    professionalId: string;
    patientId: string;
    specialty: string;
    patientName: string;
    patientEmail: string | null;
    patientPhone: string | null;
    patientBirth: Date | null;
    patientGender: string | null;
    patientCity: string | null;
    chiefComplaint: string | null;
    generalNotes: string | null;
    specialtyData: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    sessionNotes: SessionNoteItem[];
  };
};

type ClientRecordWithNotes = NonNullable<ClientRecordResult["record"]>;

// =========================================================
// ACTION 1 - Get or create ClientRecord
// =========================================================

export async function getOrCreateClientRecord(
  patientId: string,
): Promise<ClientRecordResult> {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      session.user.userType !== "PROFESSIONAL" ||
      session.user.industry !== "HEALTH"
    ) {
      return { success: false, error: "Nao autorizado." };
    }

    const professionalId = session.user.id;

    const professional = await db.user.findUnique({
      where: { id: professionalId },
      select: { jobTitle: true },
    });

    const patient = await db.user.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        phone: true,
        birthDate: true,
        gender: true,
        city: true,
      },
    });

    if (!patient) {
      return { success: false, error: "Paciente nao encontrado." };
    }

    const specialty = resolveSpecialty(professional?.jobTitle ?? "");

    const record = await db.clientRecord.upsert({
      where: {
        professionalId_patientId: {
          professionalId,
          patientId,
        },
      },
      create: {
        professionalId,
        patientId,
        specialty,
        patientName: patient.displayName || patient.name,
        patientEmail: patient.email,
        patientPhone: patient.phone,
        patientBirth: patient.birthDate,
        patientGender: patient.gender,
        patientCity: patient.city,
        specialtyData: {},
      },
      update: {
        patientName: patient.displayName || patient.name,
        patientEmail: patient.email,
        patientPhone: patient.phone,
        patientCity: patient.city,
      },
      include: {
        sessionNotes: {
          orderBy: { sessionDate: "desc" },
        },
      },
    });

    return {
      success: true,
      record: serializeClientRecord(record),
    };
  } catch (error) {
    console.error("[GET_OR_CREATE_CLIENT_RECORD]", error);
    return { success: false, error: "Erro ao carregar prontuario." };
  }
}

// =========================================================
// ACTION 2 - Update ClientRecord
// =========================================================

export async function updateClientRecord(
  recordId: string,
  data: {
    chiefComplaint?: string;
    generalNotes?: string;
    specialtyData?: Record<string, unknown>;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      session.user.userType !== "PROFESSIONAL" ||
      session.user.industry !== "HEALTH"
    ) {
      return { success: false, error: "Nao autorizado." };
    }

    const record = await db.clientRecord.findUnique({
      where: { id: recordId },
      select: { professionalId: true, patientId: true },
    });

    if (!record || record.professionalId !== session.user.id) {
      return { success: false, error: "Prontuario nao encontrado." };
    }

    await db.clientRecord.update({
      where: { id: recordId },
      data: {
        chiefComplaint: data.chiefComplaint,
        generalNotes: data.generalNotes,
        specialtyData: data.specialtyData as Prisma.InputJsonValue | undefined,
      },
    });

    revalidateRecordPaths(record.patientId);

    return { success: true };
  } catch (error) {
    console.error("[UPDATE_CLIENT_RECORD]", error);
    return { success: false, error: "Erro ao salvar prontuario." };
  }
}

// =========================================================
// ACTION 3 - Create SessionNote
// =========================================================

export async function createSessionNote(
  clientRecordId: string,
  data: {
    sessionDate: string;
    content: string;
    evolution?: string;
    nextSteps?: string;
    privateNotes?: string;
    appointmentId?: string;
  },
): Promise<{ success: boolean; error?: string; noteId?: string }> {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      session.user.userType !== "PROFESSIONAL" ||
      session.user.industry !== "HEALTH"
    ) {
      return { success: false, error: "Nao autorizado." };
    }

    const record = await db.clientRecord.findUnique({
      where: { id: clientRecordId },
      select: { professionalId: true, patientId: true },
    });

    if (!record || record.professionalId !== session.user.id) {
      return { success: false, error: "Prontuario nao encontrado." };
    }

    if (!data.content || data.content.trim().length < 10) {
      return {
        success: false,
        error: "A nota da sessao deve ter pelo menos 10 caracteres.",
      };
    }

    const sessionDate = new Date(data.sessionDate);
    if (Number.isNaN(sessionDate.getTime())) {
      return { success: false, error: "Data da sessao invalida." };
    }

    if (data.appointmentId) {
      const appointment = await db.appointment.findUnique({
        where: { id: data.appointmentId },
        select: { professionalId: true, patientId: true },
      });

      if (
        !appointment ||
        appointment.professionalId !== session.user.id ||
        appointment.patientId !== record.patientId
      ) {
        return { success: false, error: "Consulta invalida para esta nota." };
      }
    }

    const note = await db.sessionNote.create({
      data: {
        clientRecordId,
        professionalId: session.user.id,
        appointmentId: data.appointmentId ?? null,
        sessionDate,
        content: data.content.trim(),
        evolution: data.evolution?.trim() || null,
        nextSteps: data.nextSteps?.trim() || null,
        privateNotes: data.privateNotes?.trim() || null,
      },
    });

    revalidateRecordPaths(record.patientId);

    return { success: true, noteId: note.id };
  } catch (error) {
    console.error("[CREATE_SESSION_NOTE]", error);
    return { success: false, error: "Erro ao salvar nota de sessao." };
  }
}

// =========================================================
// ACTION 4 - List SessionNotes
// =========================================================

export async function listSessionNotes(
  clientRecordId: string,
): Promise<{ success: boolean; error?: string; notes?: SessionNoteItem[] }> {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      session.user.userType !== "PROFESSIONAL" ||
      session.user.industry !== "HEALTH"
    ) {
      return { success: false, error: "Nao autorizado." };
    }

    const record = await db.clientRecord.findUnique({
      where: { id: clientRecordId },
      select: { professionalId: true },
    });

    if (!record || record.professionalId !== session.user.id) {
      return { success: false, error: "Prontuario nao encontrado." };
    }

    const notes = await db.sessionNote.findMany({
      where: {
        clientRecordId,
        professionalId: session.user.id,
      },
      orderBy: { sessionDate: "desc" },
    });

    return { success: true, notes };
  } catch (error) {
    console.error("[LIST_SESSION_NOTES]", error);
    return { success: false, error: "Erro ao listar notas de sessao." };
  }
}

// =========================================================
// ACTION 5 - Get full ClientRecord
// =========================================================

export async function getClientRecord(
  recordId: string,
): Promise<ClientRecordResult> {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      session.user.userType !== "PROFESSIONAL" ||
      session.user.industry !== "HEALTH"
    ) {
      return { success: false, error: "Nao autorizado." };
    }

    const record = await db.clientRecord.findUnique({
      where: { id: recordId },
      include: {
        sessionNotes: {
          orderBy: { sessionDate: "desc" },
        },
      },
    });

    if (!record || record.professionalId !== session.user.id) {
      return { success: false, error: "Prontuario nao encontrado." };
    }

    return {
      success: true,
      record: serializeClientRecord(record),
    };
  } catch (error) {
    console.error("[GET_CLIENT_RECORD]", error);
    return { success: false, error: "Erro ao carregar prontuario." };
  }
}

// =========================================================
// HELPERS
// =========================================================

function resolveSpecialty(jobTitle: string): Specialty {
  const title = jobTitle.toLowerCase();

  if (title.includes("psicol")) return "PSYCHOLOGIST";
  if (title.includes("nutri")) return "NUTRITIONIST";
  if (title.includes("personal") || title.includes("trainer")) {
    return "PERSONAL_TRAINER";
  }
  if (title.includes("advog") || title.includes("jurid")) return "LAWYER";
  if (
    title.includes("ingl") ||
    title.includes("english") ||
    title.includes("professor")
  ) {
    return "ENGLISH_TEACHER";
  }

  return "PSYCHOLOGIST";
}

function serializeClientRecord(record: {
  id: string;
  professionalId: string;
  patientId: string;
  specialty: string;
  patientName: string;
  patientEmail: string | null;
  patientPhone: string | null;
  patientBirth: Date | null;
  patientGender: string | null;
  patientCity: string | null;
  chiefComplaint: string | null;
  generalNotes: string | null;
  specialtyData: unknown;
  createdAt: Date;
  updatedAt: Date;
  sessionNotes: SessionNoteItem[];
}): ClientRecordWithNotes {
  return {
    ...record,
    specialtyData:
      record.specialtyData &&
      typeof record.specialtyData === "object" &&
      !Array.isArray(record.specialtyData)
        ? (record.specialtyData as Record<string, unknown>)
        : {},
  };
}

function revalidateRecordPaths(patientId: string) {
  revalidatePath(`/agendar-consulta/prontuario/${patientId}`);
  revalidatePath("/agendar-consulta/dashboard-profissional");
}
