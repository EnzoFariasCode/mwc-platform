import "server-only";

import { db } from "@/lib/prisma";
import { ensureAppointmentPaymentConfirmedEmails } from "@/modules/health/services/transactional-email-service";

const DEFAULT_SCAN_LIMIT = 100;
const DEFAULT_REPAIR_LIMIT = 25;
const REPAIR_CONCURRENCY = 5;
const LOOKBACK_DAYS = 30;

export type AppointmentConfirmationEmailRecoveryMetrics = {
  inspected: number;
  missing: number;
  repaired: number;
  failed: number;
};

export async function recoverMissingAppointmentConfirmationEmails({
  now = new Date(),
  repairLimit = DEFAULT_REPAIR_LIMIT,
}: {
  now?: Date;
  repairLimit?: number;
} = {}): Promise<AppointmentConfirmationEmailRecoveryMetrics> {
  if (Number.isNaN(now.getTime())) throw new Error("Data de reparo invalida.");
  if (!Number.isInteger(repairLimit) || repairLimit < 1 || repairLimit > 100) {
    throw new Error("repairLimit deve estar entre 1 e 100.");
  }

  const createdAfter = new Date(
    now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  );
  const appointments = await db.appointment.findMany({
    where: {
      paymentConfirmedAt: { not: null },
      createdAt: { gte: createdAfter },
      status: {
        in: ["MEETING_PENDING", "MEETING_REQUIRES_ATTENTION", "CONFIRMED"],
      },
    },
    orderBy: { createdAt: "desc" },
    take: DEFAULT_SCAN_LIMIT,
    select: { id: true, patientId: true, professionalId: true },
  });

  if (appointments.length === 0) {
    return { inspected: 0, missing: 0, repaired: 0, failed: 0 };
  }

  const existingEmails = await db.emailOutbox.findMany({
    where: {
      eventType: "HEALTH_APPOINTMENT_CONFIRMED",
      entityType: "APPOINTMENT",
      entityId: { in: appointments.map((appointment) => appointment.id) },
    },
    select: { entityId: true, recipientUserId: true },
  });
  const existingKeys = new Set(
    existingEmails.map(
      (email) => `${email.entityId ?? ""}:${email.recipientUserId ?? ""}`,
    ),
  );
  const missingAppointments = appointments.filter(
    (appointment) =>
      !existingKeys.has(`${appointment.id}:${appointment.patientId}`) ||
      !existingKeys.has(`${appointment.id}:${appointment.professionalId}`),
  );
  const repairTargets = missingAppointments.slice(0, repairLimit);

  let repaired = 0;
  let failed = 0;

  for (
    let index = 0;
    index < repairTargets.length;
    index += REPAIR_CONCURRENCY
  ) {
    const batch = repairTargets.slice(index, index + REPAIR_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((appointment) =>
        db.$transaction((tx) =>
          ensureAppointmentPaymentConfirmedEmails(tx, appointment.id),
        ),
      ),
    );

    repaired += results.filter((result) => result.status === "fulfilled").length;
    failed += results.filter((result) => result.status === "rejected").length;
  }

  const metrics = {
    inspected: appointments.length,
    missing: missingAppointments.length,
    repaired,
    failed,
  };
  console.info("[HEALTH_CONFIRMATION_EMAIL_RECOVERY_METRICS]", metrics);
  return metrics;
}
