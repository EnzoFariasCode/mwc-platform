import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/prisma";

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

  if (
    Number.isNaN(dateTime.getTime()) ||
    dateTime.getFullYear() !== year ||
    dateTime.getMonth() !== month - 1 ||
    dateTime.getDate() !== day ||
    dateTime.getHours() !== hours ||
    dateTime.getMinutes() !== minutes
  ) {
    return null;
  }

  return dateTime;
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

  const { proId, patientId, date, time } = session.metadata;
  const appointmentDateTime = parseHealthAppointmentDateTime(date, time);

  if (!proId || !patientId || !time || !appointmentDateTime) {
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
    return { success: false, error: "Profissional invalido." };
  }

  const expectedAmount = professional.consultationFee
    .mul(100)
    .toDecimalPlaces(0)
    .toNumber();

  if (
    session.currency?.toLowerCase() !== "brl" ||
    session.amount_total !== expectedAmount
  ) {
    return { success: false, error: "Valor do pagamento invalido." };
  }

  const existingSlot = await db.appointment.findFirst({
    where: {
      professionalId: proId,
      date: appointmentDateTime,
      time,
      status: { not: "CANCELED" },
    },
    select: { id: true, patientId: true, professionalId: true, stripeSessionId: true },
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
    const appointment = await db.appointment.create({
      data: {
        patientId,
        professionalId: proId,
        date: appointmentDateTime,
        time,
        status: "SCHEDULED",
        stripeSessionId: session.id,
        meetLink: `https://meet.google.com/mwc-${Math.random()
          .toString(36)
          .substring(2, 11)}`,
        price: session.amount_total / 100,
      },
      select: { id: true, professionalId: true, patientId: true },
    });

    revalidatePath("/agendar-consulta/historico");
    revalidatePath("/agendar-consulta/dashboard-profissional");
    revalidatePath(`/agendar-consulta/perfil/${appointment.professionalId}`);

    return {
      success: true,
      appointmentId: appointment.id,
      professionalId: appointment.professionalId,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const processedAfterRace = await db.appointment.findUnique({
        where: { stripeSessionId: session.id },
        select: { id: true, professionalId: true },
      });

      if (processedAfterRace) {
        return {
          success: true,
          alreadyProcessed: true,
          appointmentId: processedAfterRace.id,
          professionalId: processedAfterRace.professionalId,
        };
      }

      if (error.code === "P2002") {
        return { success: false, error: "Este horario ja foi reservado." };
      }

      if (error.code === "P2003") {
        return {
          success: false,
          error: "Paciente ou profissional nao encontrado no banco.",
        };
      }
    }

    console.error("[FINALIZE_HEALTH_APPOINTMENT_PAYMENT_ERROR]", error);
    return { success: false, error: "Erro ao confirmar consulta." };
  }
}
