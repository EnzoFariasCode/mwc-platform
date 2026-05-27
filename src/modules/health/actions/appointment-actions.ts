"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  addMinutes,
  addMonths,
  endOfMonth,
  isBefore,
  isValid,
  parse,
  format, // <-- O LINTER QUEBROU PORQUE ISSO FALTAVA AQUI
} from "date-fns";

const PLATFORM_FEE_PERCENT = 10;

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

    const availabilityRule = await db.professionalAvailability.findFirst({
      where: {
        professionalId: professional.id,
        dayOfWeek: reqDate.getDay(),
        isActive: true,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    if (!availabilityRule) {
      return {
        error: "O profissional nao atende neste dia da semana.",
      };
    }

    const exception = await db.availabilityException.findFirst({
      where: {
        professionalId: professional.id,
        date: reqDate,
      },
    });

    if (exception && !exception.isAvailable) {
      return { error: "O profissional nao atende nesta data especifica." };
    }

    if (isBefore(reqDateTime, now)) {
      return { error: "Nao e possivel agendar um horario no passado." };
    }

    const maxAllowedDate = endOfMonth(addMonths(now, 1));
    if (reqDate > maxAllowedDate) {
      return {
        error: "A data solicitada esta fora da janela permitida.",
      };
    }

    const dayRule = availabilityRule;
    const duration = professional.sessionDuration || 50;
    let currentSlot = parse(dayRule.startTime, "HH:mm", reqDate);
    const endSlot = parse(dayRule.endTime, "HH:mm", reqDate);
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
        date: reqDate,
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
        date: reqDate,
        time: formData.time,
        status: "CONFIRMED",
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

export async function cancelPatientAppointment(appointmentId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Voce precisa estar logado para cancelar." };
  }

  if (!appointmentId) {
    return { error: "Consulta invalida." };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          date: true,
          time: true,
          status: true,
          price: true,
          patientId: true,
          professionalId: true,
          stripeSessionId: true,
          notes: true,
        },
      });

      if (!appointment) {
        throw new Error("Consulta nao encontrada.");
      }

      if (appointment.patientId !== session.user.id) {
        throw new Error("Voce nao tem permissao para cancelar esta consulta.");
      }

      if (
        appointment.status === "CANCELED" ||
        appointment.status === "COMPLETED" ||
        appointment.status === "REFUNDED" ||
        appointment.status === "NO_SHOW"
      ) {
        throw new Error("Apenas consultas agendadas podem ser canceladas.");
      }

      if (appointment.date <= new Date()) {
        throw new Error("Nao e possivel cancelar uma consulta passada.");
      }

      const cancelNote = `Cancelada pelo paciente em ${new Date().toLocaleString("pt-BR")}.`;
      const notes = appointment.notes
        ? `${appointment.notes}\n\n${cancelNote}`
        : cancelNote;

      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: "CANCELED",
          notes,
        },
      });

      const grossAmount = appointment.price;
      const professionalAmount = grossAmount
        .mul(100 - PLATFORM_FEE_PERCENT)
        .div(100)
        .toDecimalPlaces(2);

      if (professionalAmount.greaterThan(0)) {
        const professional = await tx.user.findUnique({
          where: { id: appointment.professionalId },
          select: { walletBalance: true },
        });

        if (
          professional?.walletBalance.greaterThanOrEqualTo(professionalAmount)
        ) {
          await tx.user.update({
            where: { id: appointment.professionalId },
            data: {
              walletBalance: {
                decrement: professionalAmount,
              },
            },
          });

          await tx.transaction.create({
            data: {
              userId: appointment.professionalId,
              amount: professionalAmount,
              type: "DEBIT",
              status: "COMPLETED",
              description: `Estorno interno por cancelamento - Atendimento ${format(appointment.date, "dd/MM/yyyy")} as ${appointment.time}`,
            },
          });
        } else {
          await tx.transaction.create({
            data: {
              userId: appointment.professionalId,
              amount: professionalAmount,
              type: "DEBIT",
              status: "PENDING",
              description: `Ajuste pendente por cancelamento - Atendimento ${format(appointment.date, "dd/MM/yyyy")} as ${appointment.time}`,
            },
          });
        }
      }

      return {
        professionalId: appointment.professionalId,
      };
    });

    revalidatePath("/agendar-consulta/historico");
    revalidatePath("/agendar-consulta/dashboard-profissional");
    revalidatePath("/agendar-consulta/financeiro");
    revalidatePath("/dashboard/financeiro");
    revalidatePath(`/agendar-consulta/perfil/${result.professionalId}`);

    return { success: true };
  } catch (error) {
    console.error("[CANCEL_PATIENT_APPOINTMENT_ERROR]", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel cancelar a consulta.",
    };
  }
}
