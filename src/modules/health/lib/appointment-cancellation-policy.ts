import type { BookingStatus } from "@prisma/client";

export const CANCELLABLE_HEALTH_APPOINTMENT_STATUSES = [
  "PAID",
  "MEETING_PENDING",
  "MEETING_REQUIRES_ATTENTION",
  "CONFIRMED",
] as const satisfies readonly BookingStatus[];

export function isHealthAppointmentStatusCancellable(status: string) {
  return CANCELLABLE_HEALTH_APPOINTMENT_STATUSES.includes(
    status as (typeof CANCELLABLE_HEALTH_APPOINTMENT_STATUSES)[number],
  );
}

export function canPatientRequestAppointmentCancellation({
  status,
  scheduledAt,
  now = new Date(),
}: {
  status: string;
  scheduledAt: Date | null;
  now?: Date;
}) {
  return (
    isHealthAppointmentStatusCancellable(status) &&
    Boolean(scheduledAt && scheduledAt > now)
  );
}
