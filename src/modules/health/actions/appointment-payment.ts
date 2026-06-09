"use server";

import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/prisma";
import { sendPaymentConfirmedEmail } from "@/modules/health/services/transactional-email-service";

const PLATFORM_FEE_PERCENT = 10;

export type FinalizeHealthAppointmentPaymentResult = {
  success: boolean;
  alreadyProcessed?: boolean;
  appointmentId?: string;
  professionalId?: string;
  error?: string;
};

function parseHealthAppointmentDateTime(date?: string, time?: string) {
  if (!date || !time) return null;

  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return null;
  }

  const dateTime = new Date(year, month - 1, day, hours, minutes);
  const dateOnly = new Date(year, month - 1, day);

  if (
    Number.isNaN(dateOnly.getTime()) ||
    Number.isNaN(dateTime.getTime()) ||
    dateOnly.getFullYear() !== year ||
    dateOnly.getMonth() !== month - 1 ||
    dateOnly.getDate() !== day ||
    dateTime.getFullYear() !== year ||
    dateTime.getMonth() !== month - 1 ||
    dateTime.getDate() !== day ||
    dateTime.getHours() !== hours ||
    dateTime.getMinutes() !== minutes
  ) {
    return null;
  }

  return { dateOnly, dateTime };
}

export async function finalizeHealthAppointmentPayment({
  session,
  expectedPatientId,
}: {
  session: Stripe.Checkout.Session;
  expectedPatientId?: string;
}): Promise<FinalizeHealthAppointmentPaymentResult> {
  if (session.payment_status !== "paid") {
    return { success: false, error: "Pagamento ainda nao confirmado." };
  }

  if (session.metadata?.type !== "HEALTH_APPOINTMENT") {
    return { success: false, error: "Pagamento invalido." };
  }

  const { proId, patientId, date, time, holdId } = session.metadata;
  const appointmentDate = parseHealthAppointmentDateTime(date, time);

  if (!proId || !patientId || !time || !appointmentDate) {
    console.error("[FINALIZE_HEALTH_APPOINTMENT] Invalid appointment data:", {
      proId,
      patientId,
      time,
      appointmentDate,
    });
    return { success: false, error: "Dados do agendamento invalidos." };
  }

  if (expectedPatientId && expectedPatientId !== patientId) {
    return { success: false, error: "Nao autorizado." };
  }

  const alreadyProcessed = await db.appointment.findUnique({
    where: { stripeSessionId: session.id },
    select: { id: true, professionalId: true },
  });

  if (alreadyProcessed) {
    if (holdId) {
      await db.appointmentHold.deleteMany({
        where: { id: holdId, patientId, professionalId: proId },
      });
    }

    return {
      success: true,
      alreadyProcessed: true,
      appointmentId: alreadyProcessed.id,
      professionalId: alreadyProcessed.professionalId,
    };
  }

  const professional = await db.user.findFirst({
    where: {
      id: proId,
      userType: "PROFESSIONAL",
      industry: "HEALTH",
    },
    select: { id: true, consultationFee: true },
  });

  if (!professional || !professional.consultationFee) {
    console.error("[FINALIZE_HEALTH_APPOINTMENT] Professional not found:", {
      proId,
    });
    return { success: false, error: "Profissional invalido." };
  }

  const expectedAmount = Math.round(Number(professional.consultationFee) * 100);

  if (session.currency?.toLowerCase() !== "brl") {
    return { success: false, error: "Valor do pagamento invalido." };
  }

  if (session.amount_total !== expectedAmount) {
    return { success: false, error: "Valor do pagamento invalido." };
  }

  const existingSlot = await db.appointment.findFirst({
    where: {
      professionalId: proId,
      date: appointmentDate.dateOnly,
      time,
      status: { not: "CANCELED" },
    },
    select: {
      id: true,
      patientId: true,
      professionalId: true,
      stripeSessionId: true,
    },
  });

  if (existingSlot) {
    if (
      existingSlot.stripeSessionId === session.id ||
      (!existingSlot.stripeSessionId && existingSlot.patientId === patientId)
    ) {
      return {
        success: true,
        alreadyProcessed: true,
        appointmentId: existingSlot.id,
        professionalId: existingSlot.professionalId,
      };
    }

    return { success: false, error: "Este horario ja foi reservado." };
  }

  try {
    const appointment = await db.$transaction(async (tx) => {
      const grossAmount = new Prisma.Decimal(session.amount_total ?? 0).div(
        100,
      );
      const professionalAmount = grossAmount
        .mul(100 - PLATFORM_FEE_PERCENT)
        .div(100)
        .toDecimalPlaces(2);

      const createdAppointment = await tx.appointment.create({
        data: {
          patientId,
          professionalId: proId,
          date: appointmentDate.dateOnly,
          time,
          status: "CONFIRMED", // <-- AQUI MATAMOS O ITEM 6! (Era "PAID")
          stripeSessionId: session.id,
          meetLink: `https://meet.google.com/mwc-${Math.random()
            .toString(36)
            .substring(2, 11)}`,
          price: grossAmount,
          acceptedPaymentTerms: true,
          paymentTermsAcceptedAt: new Date(),
          paymentTermsIpAddress:
            session.metadata?.paymentTermsIpAddress || "unknown",
        },
        select: {
          id: true,
          professionalId: true,
          patientId: true,
          date: true,
          time: true,
          price: true,
          meetLink: true,
          patient: { select: { name: true, email: true } },
          professional: { select: { name: true, email: true } },
        },
      });

      if (holdId) {
        await tx.appointmentHold.deleteMany({
          where: {
            id: holdId,
            patientId,
            professionalId: proId,
            date: appointmentDate.dateOnly,
            time,
          },
        });
      }

      await tx.user.update({
        where: { id: proId },
        data: {
          pendingBalance: {
            increment: professionalAmount,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId: proId,
          amount: professionalAmount,
          type: "CREDIT",
          status: "PENDING",
          description: `Atendimento MWC Online (${PLATFORM_FEE_PERCENT}% taxa) - ${date} as ${time} - Stripe: ${session.id}`,
        },
      });

      return createdAppointment;
    });

    revalidatePath("/agendar-consulta/historico");
    revalidatePath("/agendar-consulta/dashboard-profissional");
    revalidatePath("/agendar-consulta/financeiro");
    revalidatePath("/dashboard/financeiro");
    revalidatePath(`/agendar-consulta/perfil/${appointment.professionalId}`);

    await sendPaymentConfirmedEmail({
      patient: appointment.patient,
      professional: appointment.professional,
      date: appointment.date,
      time: appointment.time,
      price: appointment.price,
      meetLink: appointment.meetLink,
    });

    return {
      success: true,
      appointmentId: appointment.id,
      professionalId: appointment.professionalId,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { success: false, error: "Este horario ja foi reservado." };
      }
    }
    console.error("[FINALIZE_HEALTH_APPOINTMENT_PAYMENT_ERROR]", error);
    return { success: false, error: "Erro ao confirmar consulta." };
  }
}
