"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Schema Zod ───────────────────────────────────────────────────────────────

const HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const dayScheduleSchema = z
  .object({
    active: z.boolean(),
    start: z.string().regex(HH_MM_REGEX, "Horário de início inválido (HH:mm)"),
    end: z.string().regex(HH_MM_REGEX, "Horário de término inválido (HH:mm)"),
  })
  .refine(
    (day) => {
      // Só valida a ordem quando o dia está ativo
      if (!day.active) return true;
      return day.start < day.end;
    },
    { message: "O horário de início deve ser anterior ao de término" },
  );

const weeklyAvailabilitySchema = z.object({
  segunda: dayScheduleSchema,
  terca: dayScheduleSchema,
  quarta: dayScheduleSchema,
  quinta: dayScheduleSchema,
  sexta: dayScheduleSchema,
  sabado: dayScheduleSchema,
  domingo: dayScheduleSchema,
});

// ─── Tipos (mantidos para compatibilidade com o restante do projeto) ───────────

export type DaySchedule = z.infer<typeof dayScheduleSchema>;
export type WeeklyAvailability = z.infer<typeof weeklyAvailabilitySchema>;

const mapDays = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
} as const;

// ─── Server Action ────────────────────────────────────────────────────────────

export async function updateHealthSchedule(scheduleData: WeeklyAvailability) {
  const session = await auth();

  if (
    !session?.user?.id ||
    session.user.userType !== "PROFESSIONAL" ||
    session.user.industry !== "HEALTH"
  ) {
    return {
      error:
        "Acesso negado. Apenas profissionais de saúde podem editar a agenda.",
    };
  }

  // Validação completa com Zod
  const parsed = weeklyAvailabilitySchema.safeParse(scheduleData);

  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Formato de agenda inválido.";
    return { error: firstError };
  }

  try {
    const proId = session.user.id;

    // Transação: Limpa a agenda antiga e insere a nova nas tabelas relacionais
    await db.$transaction(async (tx) => {
      // 1. Remove as disponibilidades antigas deste profissional
      await tx.professionalAvailability.deleteMany({
        where: { professionalId: proId },
      });

      // 2. Prepara os novos dados relacionais
      const newAvailabilities = Object.entries(parsed.data).map(
        ([dayKey, data]) => {
          return {
            professionalId: proId,
            dayOfWeek: mapDays[dayKey as keyof WeeklyAvailability],
            isActive: data.active,
            startTime: data.start,
            endTime: data.end,
          };
        },
      );

      // 3. Insere em massa na nova tabela
      await tx.professionalAvailability.createMany({
        data: newAvailabilities,
      });
    });

    // Atualiza a cache das páginas
    revalidatePath("/agendar-consulta/dashboard-profissional");
    revalidatePath(`/agendar-consulta/perfil/${session.user.id}`);

    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar agenda:", error);
    return { error: "Erro interno ao salvar os horários." };
  }
}
