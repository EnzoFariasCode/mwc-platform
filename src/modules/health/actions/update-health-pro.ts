"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isValidTimeZone } from "../lib/appointment-completion-time";
import {
  getHealthProfessionalIdentityError,
  isTeacherOnlineSpecialty,
} from "../lib/health-professional-eligibility";
import { buildProfessionalCredential } from "../lib/professional-credentials";

const ALLOWED_DURATIONS = [30, 50, 60, 90] as const;

const updateHealthProSchema = z.object({
  displayName: z.string().max(80).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  documentReg: z.string().max(50).optional().nullable(),
  teachingSubject: z
    .string()
    .max(100, "Materia ou area de ensino deve ter no maximo 100 caracteres")
    .optional()
    .nullable(),
  approach: z.string().max(500).optional().nullable(),
  sessionDuration: z
    .number()
    .refine((value) =>
      (ALLOWED_DURATIONS as readonly number[]).includes(value),
    )
    .default(50),
  consultationFee: z
    .number()
    .positive("O valor da consulta deve ser maior que zero")
    .finite("Valor invalido")
    .optional()
    .nullable(),
  timezone: z.string().refine(isValidTimeZone, "Fuso horario invalido"),
});

function parseRawFormData(formData: FormData) {
  const toNullable = (key: string) => {
    const value = formData.get(key);
    if (typeof value !== "string" || value.trim() === "") return null;
    return value.trim();
  };

  const rawDuration = formData.get("sessionDuration");
  const rawFee = formData.get("consultationFee");
  const credentialType = formData.get("documentRegType");
  const credentialNumber = formData.get("documentRegNumber");
  const documentReg =
    typeof credentialType === "string" &&
    typeof credentialNumber === "string" &&
    credentialType.trim() &&
    credentialNumber.trim()
      ? buildProfessionalCredential(credentialType, credentialNumber)
      : toNullable("documentReg");

  return {
    displayName: toNullable("displayName"),
    bio: toNullable("bio"),
    jobTitle: toNullable("jobTitle"),
    documentReg,
    teachingSubject: toNullable("teachingSubject"),
    approach: toNullable("approach"),
    sessionDuration: rawDuration !== null ? Number(rawDuration) : 50,
    consultationFee:
      rawFee !== null && rawFee !== "" ? Number(rawFee) : null,
    timezone: toNullable("timezone") || "America/Sao_Paulo",
  };
}

export async function updateHealthProProfile(formData: FormData) {
  const session = await auth();

  if (
    !session?.user?.id ||
    session.user.userType !== "PROFESSIONAL" ||
    session.user.industry !== "HEALTH"
  ) {
    return { error: "Nao autorizado" };
  }

  const professional = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onlineSpecialty: true },
  });

  if (!professional?.onlineSpecialty) {
    return { error: "Categoria profissional do MWC Online nao configurada." };
  }

  const parsed = updateHealthProSchema.safeParse(parseRawFormData(formData));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const data = parsed.data;
  const identityError = getHealthProfessionalIdentityError({
    onlineSpecialty: professional.onlineSpecialty,
    documentReg: data.documentReg,
    teachingSubject: data.teachingSubject,
  });

  if (identityError) return { error: identityError };

  const isTeacher = isTeacherOnlineSpecialty(professional.onlineSpecialty);

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        displayName: data.displayName ?? null,
        bio: data.bio ?? null,
        jobTitle: isTeacher ? "Professor" : (data.jobTitle ?? null),
        documentReg: isTeacher ? null : (data.documentReg ?? null),
        teachingSubject: isTeacher ? (data.teachingSubject ?? null) : null,
        approach: data.approach ?? null,
        sessionDuration: data.sessionDuration,
        consultationFee: data.consultationFee ?? null,
        timezone: data.timezone,
      },
    });

    revalidatePath("/agendar-consulta/dashboard-profissional");
    revalidatePath(`/agendar-consulta/perfil/${session.user.id}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil profissional:", error);
    return { error: "Erro interno ao salvar dados" };
  }
}
