"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

      const pendingTransaction = appointment.stripeSessionId
        ? await tx.transaction.findFirst({
            where: {
              userId: appointment.professionalId,
              type: "CREDIT",
              status: "PENDING",
              description: {
                contains: appointment.stripeSessionId,
              },
            },
            select: {
              id: true,
              amount: true,
            },
          })
        : null;

      if (pendingTransaction) {
        await tx.transaction.update({
          where: { id: pendingTransaction.id },
          data: {
            status: "CANCELED",
          },
        });

        await tx.user.update({
          where: { id: appointment.professionalId },
          data: {
            pendingBalance: {
              decrement: pendingTransaction.amount,
            },
          },
        });
      }

      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: "CANCELED",
          notes,
        },
      });

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

export async function completeHealthAppointment(appointmentId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Voce precisa estar logado para concluir a consulta." };
  }

  if (!appointmentId) {
    return { error: "Consulta invalida." };
  }

  try {
    await db.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          status: true,
          professionalId: true,
          stripeSessionId: true,
        },
      });

      if (!appointment) {
        throw new Error("Consulta nao encontrada.");
      }

      if (appointment.professionalId !== session.user.id) {
        throw new Error("Voce nao tem permissao para concluir esta consulta.");
      }

      if (appointment.status !== "CONFIRMED") {
        throw new Error("Apenas consultas confirmadas podem ser concluidas.");
      }

      if (!appointment.stripeSessionId) {
        throw new Error("Consulta sem referencia de pagamento Stripe.");
      }

      const pendingTransaction = await tx.transaction.findFirst({
        where: {
          userId: appointment.professionalId,
          type: "CREDIT",
          status: "PENDING",
          description: {
            contains: appointment.stripeSessionId,
          },
        },
        select: {
          id: true,
          amount: true,
        },
      });

      if (!pendingTransaction) {
        throw new Error(
          "Transacao financeira pendente nao encontrada para esta consulta.",
        );
      }

      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: "COMPLETED",
        },
      });

      await tx.transaction.update({
        where: { id: pendingTransaction.id },
        data: {
          status: "COMPLETED",
        },
      });

      await tx.user.update({
        where: { id: appointment.professionalId },
        data: {
          pendingBalance: {
            decrement: pendingTransaction.amount,
          },
          walletBalance: {
            increment: pendingTransaction.amount,
          },
        },
      });
    });

    revalidatePath("/agendar-consulta/historico");
    revalidatePath("/agendar-consulta/dashboard-profissional");
    revalidatePath("/agendar-consulta/financeiro");
    revalidatePath("/dashboard/financeiro");

    return { success: true };
  } catch (error) {
    console.error("[COMPLETE_HEALTH_APPOINTMENT_ERROR]", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel concluir a consulta.",
    };
  }
}
