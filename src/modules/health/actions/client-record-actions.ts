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
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyContactRel: string | null;
    occupation: string | null;
    previousTreatments: string | null;
    familyHistory: string | null;
    continuousMedications: string | null;
    sessionValueAgreed: number | null;
    sessionFrequency: string | null;
    fixedSessionDay: string | null;
    fixedSessionTime: string | null;
    nutritionDiagnosedPathologies: string | null;
    nutritionFamilyHistory: string | null;
    nutritionMedications: string | null;
    intestinalFunction: string | null;
    sleepQuality: string | null;
    stressLevel: string | null;
    physicalActivity: string | null;
    waterIntakeLiters: number | null;
    alcoholConsumption: string | null;
    smokingStatus: string | null;
    foodAllergies: string | null;
    foodAversions: string | null;
    foodPreferences: string | null;
    foodPattern: string | null;
    englishCurrentLevel: string | null;
    englishMainGoal: string | null;
    englishPreviousExperience: string | null;
    englishInitialDifficulties: string | null;
    englishClassMode: string | null;
    englishClassFrequency: string | null;
    englishClassDuration: string | null;
    englishBillingAmount: number | null;
    legalPersonType: string | null;
    legalNationality: string | null;
    legalCpf: string | null;
    legalRg: string | null;
    legalMaritalStatus: string | null;
    legalCompanyName: string | null;
    legalTradeName: string | null;
    legalCnpj: string | null;
    legalStateRegistration: string | null;
    legalRepresentativeName: string | null;
    legalRepresentativeCpf: string | null;
    legalContactEmail: string | null;
    legalContactPhones: string | null;
    legalAddress: string | null;
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
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRel?: string;
    occupation?: string;
    previousTreatments?: string;
    familyHistory?: string;
    continuousMedications?: string;
    sessionValueAgreed?: number | null;
    sessionFrequency?: string;
    fixedSessionDay?: string;
    fixedSessionTime?: string;
    nutritionDiagnosedPathologies?: string;
    nutritionFamilyHistory?: string;
    nutritionMedications?: string;
    intestinalFunction?: string;
    sleepQuality?: string;
    stressLevel?: string;
    physicalActivity?: string;
    waterIntakeLiters?: number | null;
    alcoholConsumption?: string;
    smokingStatus?: string;
    foodAllergies?: string;
    foodAversions?: string;
    foodPreferences?: string;
    foodPattern?: string;
    englishCurrentLevel?: string;
    englishMainGoal?: string;
    englishPreviousExperience?: string;
    englishInitialDifficulties?: string;
    englishClassMode?: string;
    englishClassFrequency?: string;
    englishClassDuration?: string;
    englishBillingAmount?: number | null;
    legalPersonType?: string;
    legalNationality?: string;
    legalCpf?: string;
    legalRg?: string;
    legalMaritalStatus?: string;
    legalCompanyName?: string;
    legalTradeName?: string;
    legalCnpj?: string;
    legalStateRegistration?: string;
    legalRepresentativeName?: string;
    legalRepresentativeCpf?: string;
    legalContactEmail?: string;
    legalContactPhones?: string;
    legalAddress?: string;
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
        ...(data.chiefComplaint !== undefined && {
          chiefComplaint: data.chiefComplaint || null,
        }),
        ...(data.generalNotes !== undefined && {
          generalNotes: data.generalNotes || null,
        }),
        ...(data.specialtyData !== undefined && {
          specialtyData: data.specialtyData as Prisma.InputJsonValue,
        }),
        ...(data.emergencyContactName !== undefined && {
          emergencyContactName: data.emergencyContactName || null,
        }),
        ...(data.emergencyContactPhone !== undefined && {
          emergencyContactPhone: data.emergencyContactPhone || null,
        }),
        ...(data.emergencyContactRel !== undefined && {
          emergencyContactRel: data.emergencyContactRel || null,
        }),
        ...(data.occupation !== undefined && {
          occupation: data.occupation || null,
        }),
        ...(data.previousTreatments !== undefined && {
          previousTreatments: data.previousTreatments || null,
        }),
        ...(data.familyHistory !== undefined && {
          familyHistory: data.familyHistory || null,
        }),
        ...(data.continuousMedications !== undefined && {
          continuousMedications: data.continuousMedications || null,
        }),
        ...(data.sessionValueAgreed !== undefined && {
          sessionValueAgreed: data.sessionValueAgreed,
        }),
        ...(data.sessionFrequency !== undefined && {
          sessionFrequency: data.sessionFrequency || null,
        }),
        ...(data.fixedSessionDay !== undefined && {
          fixedSessionDay: data.fixedSessionDay || null,
        }),
        ...(data.fixedSessionTime !== undefined && {
          fixedSessionTime: data.fixedSessionTime || null,
        }),
        ...(data.nutritionDiagnosedPathologies !== undefined && {
          nutritionDiagnosedPathologies:
            data.nutritionDiagnosedPathologies || null,
        }),
        ...(data.nutritionFamilyHistory !== undefined && {
          nutritionFamilyHistory: data.nutritionFamilyHistory || null,
        }),
        ...(data.nutritionMedications !== undefined && {
          nutritionMedications: data.nutritionMedications || null,
        }),
        ...(data.intestinalFunction !== undefined && {
          intestinalFunction: data.intestinalFunction || null,
        }),
        ...(data.sleepQuality !== undefined && {
          sleepQuality: data.sleepQuality || null,
        }),
        ...(data.stressLevel !== undefined && {
          stressLevel: data.stressLevel || null,
        }),
        ...(data.physicalActivity !== undefined && {
          physicalActivity: data.physicalActivity || null,
        }),
        ...(data.waterIntakeLiters !== undefined && {
          waterIntakeLiters: data.waterIntakeLiters,
        }),
        ...(data.alcoholConsumption !== undefined && {
          alcoholConsumption: data.alcoholConsumption || null,
        }),
        ...(data.smokingStatus !== undefined && {
          smokingStatus: data.smokingStatus || null,
        }),
        ...(data.foodAllergies !== undefined && {
          foodAllergies: data.foodAllergies || null,
        }),
        ...(data.foodAversions !== undefined && {
          foodAversions: data.foodAversions || null,
        }),
        ...(data.foodPreferences !== undefined && {
          foodPreferences: data.foodPreferences || null,
        }),
        ...(data.foodPattern !== undefined && {
          foodPattern: data.foodPattern || null,
        }),
        ...(data.englishCurrentLevel !== undefined && {
          englishCurrentLevel: data.englishCurrentLevel || null,
        }),
        ...(data.englishMainGoal !== undefined && {
          englishMainGoal: data.englishMainGoal || null,
        }),
        ...(data.englishPreviousExperience !== undefined && {
          englishPreviousExperience: data.englishPreviousExperience || null,
        }),
        ...(data.englishInitialDifficulties !== undefined && {
          englishInitialDifficulties: data.englishInitialDifficulties || null,
        }),
        ...(data.englishClassMode !== undefined && {
          englishClassMode: data.englishClassMode || null,
        }),
        ...(data.englishClassFrequency !== undefined && {
          englishClassFrequency: data.englishClassFrequency || null,
        }),
        ...(data.englishClassDuration !== undefined && {
          englishClassDuration: data.englishClassDuration || null,
        }),
        ...(data.englishBillingAmount !== undefined && {
          englishBillingAmount: data.englishBillingAmount,
        }),
        ...(data.legalPersonType !== undefined && {
          legalPersonType: data.legalPersonType || null,
        }),
        ...(data.legalNationality !== undefined && {
          legalNationality: data.legalNationality || null,
        }),
        ...(data.legalCpf !== undefined && {
          legalCpf: data.legalCpf || null,
        }),
        ...(data.legalRg !== undefined && {
          legalRg: data.legalRg || null,
        }),
        ...(data.legalMaritalStatus !== undefined && {
          legalMaritalStatus: data.legalMaritalStatus || null,
        }),
        ...(data.legalCompanyName !== undefined && {
          legalCompanyName: data.legalCompanyName || null,
        }),
        ...(data.legalTradeName !== undefined && {
          legalTradeName: data.legalTradeName || null,
        }),
        ...(data.legalCnpj !== undefined && {
          legalCnpj: data.legalCnpj || null,
        }),
        ...(data.legalStateRegistration !== undefined && {
          legalStateRegistration: data.legalStateRegistration || null,
        }),
        ...(data.legalRepresentativeName !== undefined && {
          legalRepresentativeName: data.legalRepresentativeName || null,
        }),
        ...(data.legalRepresentativeCpf !== undefined && {
          legalRepresentativeCpf: data.legalRepresentativeCpf || null,
        }),
        ...(data.legalContactEmail !== undefined && {
          legalContactEmail: data.legalContactEmail || null,
        }),
        ...(data.legalContactPhones !== undefined && {
          legalContactPhones: data.legalContactPhones || null,
        }),
        ...(data.legalAddress !== undefined && {
          legalAddress: data.legalAddress || null,
        }),
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
// ACTION 6 - List all ClientRecords for professional
// =========================================================

export type ClientRecordSummary = {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string | null;
  patientCity: string | null;
  specialty: string;
  chiefComplaint: string | null;
  totalNotes: number;
  lastSessionDate: Date | null;
  totalLegalCases: number;
  lastLegalActivityDate: Date | null;
  updatedAt: Date;
};

export async function listProfessionalClientRecords(): Promise<{
  success: boolean;
  error?: string;
  records?: ClientRecordSummary[];
}> {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      session.user.userType !== "PROFESSIONAL" ||
      session.user.industry !== "HEALTH"
    ) {
      return { success: false, error: "Nao autorizado." };
    }

    const records = await db.clientRecord.findMany({
      where: { professionalId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        patientId: true,
        patientName: true,
        patientEmail: true,
        patientCity: true,
        specialty: true,
        chiefComplaint: true,
        updatedAt: true,
        sessionNotes: {
          orderBy: { sessionDate: "desc" },
          take: 1,
          select: { sessionDate: true },
        },
        legalCases: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            updatedAt: true,
            activities: {
              orderBy: { activityDate: "desc" },
              take: 1,
              select: { activityDate: true },
            },
          },
        },
        _count: {
          select: { sessionNotes: true, legalCases: true },
        },
      },
    });

    return {
      success: true,
      records: records.map((record) => ({
        id: record.id,
        patientId: record.patientId,
        patientName: record.patientName,
        patientEmail: record.patientEmail,
        patientCity: record.patientCity,
        specialty: record.specialty,
        chiefComplaint: record.chiefComplaint,
        totalNotes: record._count.sessionNotes,
        lastSessionDate: record.sessionNotes[0]?.sessionDate ?? null,
        totalLegalCases: record._count.legalCases,
        lastLegalActivityDate:
          record.legalCases[0]?.activities[0]?.activityDate ??
          record.legalCases[0]?.updatedAt ??
          null,
        updatedAt: record.updatedAt,
      })),
    };
  } catch (error) {
    console.error("[LIST_PROFESSIONAL_CLIENT_RECORDS]", error);
    return { success: false, error: "Erro ao carregar prontuarios." };
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
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRel: string | null;
  occupation: string | null;
  previousTreatments: string | null;
  familyHistory: string | null;
  continuousMedications: string | null;
  sessionValueAgreed: Prisma.Decimal | number | null;
  sessionFrequency: string | null;
  fixedSessionDay: string | null;
  fixedSessionTime: string | null;
  nutritionDiagnosedPathologies: string | null;
  nutritionFamilyHistory: string | null;
  nutritionMedications: string | null;
  intestinalFunction: string | null;
  sleepQuality: string | null;
  stressLevel: string | null;
  physicalActivity: string | null;
  waterIntakeLiters: Prisma.Decimal | number | null;
  alcoholConsumption: string | null;
  smokingStatus: string | null;
  foodAllergies: string | null;
  foodAversions: string | null;
  foodPreferences: string | null;
  foodPattern: string | null;
  englishCurrentLevel: string | null;
  englishMainGoal: string | null;
  englishPreviousExperience: string | null;
  englishInitialDifficulties: string | null;
  englishClassMode: string | null;
  englishClassFrequency: string | null;
  englishClassDuration: string | null;
  englishBillingAmount: Prisma.Decimal | number | null;
  legalPersonType: string | null;
  legalNationality: string | null;
  legalCpf: string | null;
  legalRg: string | null;
  legalMaritalStatus: string | null;
  legalCompanyName: string | null;
  legalTradeName: string | null;
  legalCnpj: string | null;
  legalStateRegistration: string | null;
  legalRepresentativeName: string | null;
  legalRepresentativeCpf: string | null;
  legalContactEmail: string | null;
  legalContactPhones: string | null;
  legalAddress: string | null;
  specialtyData: unknown;
  createdAt: Date;
  updatedAt: Date;
  sessionNotes: SessionNoteItem[];
}): ClientRecordWithNotes {
  return {
    ...record,
    sessionValueAgreed:
      record.sessionValueAgreed !== null
        ? Number(record.sessionValueAgreed)
        : null,
    waterIntakeLiters:
      record.waterIntakeLiters !== null
        ? Number(record.waterIntakeLiters)
        : null,
    englishBillingAmount:
      record.englishBillingAmount !== null
        ? Number(record.englishBillingAmount)
        : null,
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
