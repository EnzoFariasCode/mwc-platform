import { addMinutes, format, isValid, parse } from "date-fns";

export function parseAppointmentDateTime(date: string, time: string) {
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

  const dateOnly = new Date(year, month - 1, day);
  const dateTime = new Date(year, month - 1, day, hours, minutes);

  if (
    !isValid(dateOnly) ||
    !isValid(dateTime) ||
    format(dateOnly, "yyyy-MM-dd") !== date ||
    format(dateTime, "HH:mm") !== time
  ) {
    return null;
  }

  return { dateOnly, dateTime };
}

export function generateDaySlots(
  startTime: string,
  endTime: string,
  baseDate: Date,
  durationMinutes: number,
) {
  const slots: string[] = [];
  let current = parse(startTime, "HH:mm", baseDate);
  const end = parse(endTime, "HH:mm", baseDate);

  while (addMinutes(current, durationMinutes) <= end) {
    slots.push(format(current, "HH:mm"));
    current = addMinutes(current, durationMinutes);
  }

  return slots;
}
