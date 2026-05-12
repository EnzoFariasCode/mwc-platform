"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  addMinutes,
  addMonths,
  endOfMonth,
  format,
  isBefore,
  isValid,
  parse,
} from "date-fns";

type DayRule = {
  active: boolean;
  start: string;
  end: string;
};

const dayMap = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
];

export async function createAppointment(formData: {
  proId: string;
  date: string;
  time: string;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Voce precisa estar logado para agendar." };
  }

  try {
    const professional = await db.user.findUnique({
      where: { id: formData.proId },
      select: {
        id: true,
        userType: true,
        industry: true,
        consultationFee: true,
        availability: true,
        sessionDuration: true,
      },
    });

    if (
      !professional ||
      professional.userType !== "PROFESSIONAL" ||
      professional.industry !== "HEALTH"
    ) {
      return {
        error: "Profissional nao encontrado ou indisponivel para saude.",
      };
    }

    const [year, month, day] = formData.date.split("-").map(Number);
    const [hours, minutes] = formData.time.split(":").map(Number);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day) ||
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes)
    ) {
      return { error: "Data ou horario invalido." };
    }

    const reqDate = new Date(year, month - 1, day);
    const reqDateTime = new Date(year, month - 1, day, hours, minutes);

    if (!isValid(reqDate) || !isValid(reqDateTime)) {
      return { error: "Data ou horario invalido." };
    }

    const now = new Date();

    if (isBefore(reqDateTime, now)) {
      return { error: "Nao e possivel agendar um horario no passado." };
    }

    const maxAllowedDate = endOfMonth(addMonths(now, 1));
    if (reqDate > maxAllowedDate) {
      return {
        error: "A data solicitada esta fora da janela permitida.",
      };
    }

    const availabilityObj =
      typeof professional.availability === "string"
        ? (JSON.parse(professional.availability) as Record<
            string,
            DayRule | undefined
          >)
        : (professional.availability as Record<string, DayRule | undefined>);

    const dayName = dayMap[reqDate.getDay()];
    const dayRule = availabilityObj?.[dayName];

    if (!dayRule || dayRule.active !== true) {
      return { error: `O profissional nao atende de ${dayName}.` };
    }

    const duration = professional.sessionDuration || 50;
    let currentSlot = parse(dayRule.start, "HH:mm", reqDate);
    const endSlot = parse(dayRule.end, "HH:mm", reqDate);
    let isValidSlot = false;

    while (addMinutes(currentSlot, duration) <= endSlot) {
      if (format(currentSlot, "HH:mm") === formData.time) {
        isValidSlot = true;
        break;
      }

      currentSlot = addMinutes(currentSlot, duration);
    }

    if (!isValidSlot) {
      return {
        error:
          "Horario invalido, fora de operacao ou incompativel com a duracao da sessao.",
      };
    }

    const existingAppointment = await db.appointment.findFirst({
      where: {
        professionalId: professional.id,
        date: reqDateTime,
        status: { not: "CANCELED" },
      },
      select: { id: true },
    });

    if (existingAppointment) {
      return {
        error:
          "Desculpe, este horario acabou de ser reservado por outra pessoa.",
      };
    }

    const newAppointment = await db.appointment.create({
      data: {
        date: reqDateTime,
        time: formData.time, // ← string "14:30" já disponível
        status: "SCHEDULED",
        price: professional.consultationFee || 0,
        patientId: session.user.id,
        professionalId: professional.id,
        meetLink: `https://meet.google.com/mwc-${Math.random()
          .toString(36)
          .substring(2, 11)}`,
      },
    });

    revalidatePath("/agendar-consulta/historico");
    revalidatePath("/agendar-consulta/dashboard-profissional");
    revalidatePath(`/agendar-consulta/perfil/${professional.id}`);

    return {
      success: true,
      appointmentId: newAppointment.id,
      meetLink: newAppointment.meetLink,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error:
          "Desculpe, este horario acabou de ser reservado por outra pessoa.",
      };
    }

    console.error("Erro critico ao processar agendamento:", error);
    return {
      error: "Falha interna do servidor. Tente novamente em instantes.",
    };
  }
}
