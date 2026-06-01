"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

const PLATFORM_FEE_PERCENT = 10;

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

      // Validar janela de 24h para reembolso
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      if (appointment.date < twentyFourHoursFromNow) {
        throw new Error("Cancelamentos sao permitidos apenas com no minimo 24 horas de antecedencia. Fora dessa janela, o valor nao pode ser reembolsado.");
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
