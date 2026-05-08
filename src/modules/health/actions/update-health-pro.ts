"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Schema Zod ───────────────────────────────────────────────────────────────

const ALLOWED_DURATIONS = [30, 50, 60, 90] as const;

const updateHealthProSchema = z.object({
  displayName: z
    .string()
    .max(80, "Nome de exibição deve ter no máximo 80 caracteres")
    .optional()
    .nullable(),

  bio: z
    .string()
    .max(1000, "Bio deve ter no máximo 1000 caracteres")
    .optional()
    .nullable(),

  jobTitle: z
    .string()
    .max(100, "Título profissional deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),

  documentReg: z
    .string()
    .max(50, "Registro profissional deve ter no máximo 50 caracteres")
    .optional()
    .nullable(),

  approach: z
    .string()
    .max(500, "Abordagem deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),

  sessionDuration: z
    .number()
    .refine((v) => (ALLOWED_DURATIONS as readonly number[]).includes(v), {
      message: "Duração deve ser 30, 50, 60 ou 90 minutos",
    })
    .default(50),

  consultationFee: z
    .number()
    .nonnegative("O valor da consulta não pode ser negativo")
    .finite("Valor inválido")
    .optional()
    .nullable(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Converte FormData em objeto bruto antes de passar pro Zod */
function parseRawFormData(formData: FormData) {
  const rawDuration = formData.get("sessionDuration");
  const rawFee = formData.get("consultationFee");

  const parsedDuration = rawDuration !== null ? Number(rawDuration) : 50;
  const parsedFee = rawFee !== null && rawFee !== "" ? Number(rawFee) : null;

  // Strings opcionais: converte vazio em null para o banco
  const toNullable = (key: string) => {
    const v = formData.get(key);
    if (typeof v !== "string" || v.trim() === "") return null;
    return v.trim();
  };

  return {
    displayName: toNullable("displayName"),
    bio: toNullable("bio"),
    jobTitle: toNullable("jobTitle"),
    documentReg: toNullable("documentReg"),
    approach: toNullable("approach"),
    sessionDuration: parsedDuration,
    consultationFee: parsedFee,
  };
}

// ─── Server Action ────────────────────────────────────────────────────────────

export async function updateHealthProProfile(formData: FormData) {
  const session = await auth();

  if (
    !session?.user?.id ||
    session.user.userType !== "PROFESSIONAL" ||
    session.user.industry !== "HEALTH"
  ) {
    return { error: "Não autorizado" };
  }

  // 1. Montar objeto bruto (sem any, sem cast inseguro)
  const raw = parseRawFormData(formData);

  // 2. Validar com Zod (bloqueia NaN, Infinity, strings fora do limite etc.)
  const parsed = updateHealthProSchema.safeParse(raw);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos";
    return { error: firstError };
  }

  const data = parsed.data;

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        displayName: data.displayName ?? null,
        bio: data.bio ?? null,
        jobTitle: data.jobTitle ?? null,
        documentReg: data.documentReg ?? null,
        approach: data.approach ?? null,
        sessionDuration: data.sessionDuration,
        consultationFee: data.consultationFee ?? null,
      },
    });

    revalidatePath("/agendar-consulta/dashboard-profissional");
    revalidatePath(`/agendar-consulta/perfil/${session.user.id}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil clínico:", error);
    return { error: "Erro interno ao salvar dados" };
  }
}
