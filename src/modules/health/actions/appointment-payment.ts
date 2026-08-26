import "server-only";

import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { isValidTimeZone } from "@/modules/health/lib/appointment-completion-time";
import { db } from "@/lib/prisma";
import { ensureAppointmentPaymentConfirmedEmails } from "@/modules/health/services/transactional-email-service";

const PLATFORM_FEE_PERCENT = 10;

export type FinalizeHealthAppointmentPaymentResult = {
  success: boolean;
  alreadyProcessed?: boolean;
  meetingPending?: boolean;
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

function revalidateAppointmentPaths(professionalId: string) {
  revalidatePath("/agendar-consulta/historico");
  revalidatePath("/agendar-consulta/dashboard-profissional");
  revalidatePath("/agendar-consulta/financeiro");
  revalidatePath("/dashboard/financeiro");
  revalidatePath(`/agendar-consulta/perfil/${professionalId}`);
}

function shouldEnsureConfirmationEmail(status: string) {
  return [
    "MEETING_PENDING",
    "MEETING_REQUIRES_ATTENTION",
    "CONFIRMED",
  ].includes(status);
}

function describePersistedAppointment({
  appointmentId,
  professionalId,
  alreadyProcessed,
  status,
}: {
  appointmentId: string;
  professionalId: string;
  alreadyProcessed: boolean;
  status: string;
}): FinalizeHealthAppointmentPaymentResult {
  revalidateAppointmentPaths(professionalId);

  return {
    success: true,
    alreadyProcessed,
    meetingPending: status !== "CONFIRMED",
    appointmentId,
    professionalId,
  };
}

export async function finalizeHealthAppointmentPayment({
  session,
}: {
  session: Stripe.Checkout.Session;
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

  const alreadyProcessed = await db.appointment.findUnique({
    where: { stripeSessionId: session.id },
    select: { id: true, professionalId: true, status: true },
  });

  if (alreadyProcessed) {
    if (shouldEnsureConfirmationEmail(alreadyProcessed.status)) {
      await db.$transaction((tx) =>
        ensureAppointmentPaymentConfirmedEmails(tx, alreadyProcessed.id),
      );
    }

    if (holdId) {
      await db.appointmentHold.deleteMany({
        where: { id: holdId, patientId, professionalId: proId },
      });
    }

    return describePersistedAppointment({
      appointmentId: alreadyProcessed.id,
      professionalId: alreadyProcessed.professionalId,
      alreadyProcessed: true,
      status: alreadyProcessed.status,
    });
  }

  const professional = await db.user.findFirst({
    where: {
      id: proId,
      userType: "PROFESSIONAL",
      industry: "HEALTH",
    },
    select: {
      id: true,
      consultationFee: true,
      sessionDuration: true,
      timezone: true,
    },
  });

  if (!professional?.consultationFee) {
    console.error("[FINALIZE_HEALTH_APPOINTMENT] Professional not found:", {
      proId,
    });
    return { success: false, error: "Profissional invalido." };
  }

  const patient = await db.user.findUnique({
    where: { id: patientId },
    select: { id: true },
  });

  if (!patient) {
    return { success: false, error: "Paciente invalido." };
  }

  const expectedAmount = Math.round(Number(professional.consultationFee) * 100);
  const metadataDuration = Number(session.metadata?.durationMinutes);
  const durationMinutes =
    Number.isInteger(metadataDuration) &&
    metadataDuration > 0 &&
    metadataDuration <= 480
      ? metadataDuration
      : professional.sessionDuration || 50;
  const metadataTimeZone = session.metadata?.timezonePro || "";
  const timezonePro = isValidTimeZone(metadataTimeZone)
    ? metadataTimeZone
    : professional.timezone;

  if (
    session.currency?.toLowerCase() !== "brl" ||
    session.amount_total !== expectedAmount
  ) {
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
      status: true,
    },
  });

  if (existingSlot) {
    if (
      existingSlot.stripeSessionId === session.id ||
      (!existingSlot.stripeSessionId && existingSlot.patientId === patientId)
    ) {
      if (
        existingSlot.stripeSessionId === session.id &&
        shouldEnsureConfirmationEmail(existingSlot.status)
      ) {
        await db.$transaction((tx) =>
          ensureAppointmentPaymentConfirmedEmails(tx, existingSlot.id),
        );
      }

      return describePersistedAppointment({
        appointmentId: existingSlot.id,
        professionalId: existingSlot.professionalId,
        alreadyProcessed: true,
        status: existingSlot.status,
      });
    }

    return { success: false, error: "Este horario ja foi reservado." };
  }

  try {
    const grossAmount = new Prisma.Decimal(session.amount_total ?? 0).div(100);
    const professionalAmount = grossAmount
      .mul(100 - PLATFORM_FEE_PERCENT)
      .div(100)
      .toDecimalPlaces(2);

    const appointment = await db.$transaction(async (tx) => {
      const createdAppointment = await tx.appointment.create({
        data: {
          patientId,
          professionalId: proId,
          date: appointmentDate.dateOnly,
          time,
          durationMinutes,
          timezonePro,
          status: "MEETING_PENDING",
          stripeSessionId: session.id,
          paymentConfirmedAt: new Date(),
          meetNextAttemptAt: new Date(),
          price: grossAmount,
          acceptedPaymentTerms: true,
          paymentTermsAcceptedAt: new Date(),
          paymentTermsIpAddress:
            session.metadata?.paymentTermsIpAddress || "unknown",
        },
        select: { id: true, professionalId: true, status: true },
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
        data: { pendingBalance: { increment: professionalAmount } },
      });

      await tx.transaction.create({
        data: {
          userId: proId,
          appointmentId: createdAppointment.id,
          amount: professionalAmount,
          type: "CREDIT",
          status: "PENDING",
          description: `Atendimento MWC Online (${PLATFORM_FEE_PERCENT}% taxa) - ${date} as ${time} - Stripe: ${session.id}`,
        },
      });

      await ensureAppointmentPaymentConfirmedEmails(
        tx,
        createdAppointment.id,
      );

      return createdAppointment;
    });

    return describePersistedAppointment({
      appointmentId: appointment.id,
      professionalId: appointment.professionalId,
      alreadyProcessed: false,
      status: appointment.status,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const persisted = await db.appointment.findUnique({
        where: { stripeSessionId: session.id },
        select: { id: true, professionalId: true, status: true },
      });

      if (persisted) {
        if (shouldEnsureConfirmationEmail(persisted.status)) {
          await db.$transaction((tx) =>
            ensureAppointmentPaymentConfirmedEmails(tx, persisted.id),
          );
        }

        return describePersistedAppointment({
          appointmentId: persisted.id,
          professionalId: persisted.professionalId,
          alreadyProcessed: true,
          status: persisted.status,
        });
      }

      return { success: false, error: "Este horario ja foi reservado." };
    }

    console.error("[FINALIZE_HEALTH_APPOINTMENT_PAYMENT_ERROR]", error);
    return { success: false, error: "Erro ao registrar consulta paga." };
  }
}
