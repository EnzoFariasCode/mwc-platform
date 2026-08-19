import type { BookingStatus } from "@prisma/client";

export const CLIENT_RECORD_ELIGIBLE_APPOINTMENT_STATUSES = [
  "PAID",
  "MEETING_PENDING",
  "MEETING_REQUIRES_ATTENTION",
  "CONFIRMED",
  "RESCHEDULING",
  "COMPLETED",
  "NO_SHOW",
] as const satisfies readonly BookingStatus[];

export function canStartClientRecordFromAppointment(status: string) {
  return CLIENT_RECORD_ELIGIBLE_APPOINTMENT_STATUSES.includes(
    status as (typeof CLIENT_RECORD_ELIGIBLE_APPOINTMENT_STATUSES)[number],
  );
}
