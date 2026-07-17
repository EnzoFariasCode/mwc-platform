const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MEETING_EARLY_ACCESS_MINUTES = 10;

type AppointmentCompletionInput = {
  date: Date | string;
  time: string;
  timeZone: string;
  durationMinutes: number;
};

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

function getDateParts(date: Date | string) {
  const parsed = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(parsed.getTime())) return null;

  return {
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
  };
}

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function zonedDateTimeToUtc({
  year,
  month,
  day,
  hour,
  minute,
  timeZone,
}: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  timeZone: string;
}) {
  try {
    const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);
    let candidate = new Date(wallClockAsUtc);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const zoned = getZonedParts(candidate, timeZone);
      const representedAsUtc = Date.UTC(
        zoned.year,
        zoned.month - 1,
        zoned.day,
        zoned.hour,
        zoned.minute,
        zoned.second,
      );
      const difference = wallClockAsUtc - representedAsUtc;

      if (difference === 0) break;
      candidate = new Date(candidate.getTime() + difference);
    }

    const verified = getZonedParts(candidate, timeZone);
    if (
      verified.year !== year ||
      verified.month !== month ||
      verified.day !== day ||
      verified.hour !== hour ||
      verified.minute !== minute
    ) {
      return null;
    }

    return candidate;
  } catch {
    return null;
  }
}

export function getAppointmentCompletionAt({
  date,
  time,
  timeZone,
  durationMinutes,
}: AppointmentCompletionInput) {
  const startAt = getAppointmentStartAt({ date, time, timeZone });

  if (
    !startAt ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    durationMinutes > 480
  ) {
    return null;
  }

  return new Date(startAt.getTime() + durationMinutes * 60 * 1000);
}

export function getAppointmentStartAt({
  date,
  time,
  timeZone,
}: Omit<AppointmentCompletionInput, "durationMinutes">) {
  const dateParts = getDateParts(date);
  const timeMatch = time.match(TIME_PATTERN);

  if (!dateParts || !timeMatch || !isValidTimeZone(timeZone)) {
    return null;
  }

  return zonedDateTimeToUtc({
    ...dateParts,
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
    timeZone,
  });
}

export function canCompleteHealthAppointment(
  input: AppointmentCompletionInput,
  now = new Date(),
) {
  const completionAt = getAppointmentCompletionAt(input);
  return Boolean(completionAt && completionAt.getTime() <= now.getTime());
}

export function canAccessHealthMeeting(
  input: AppointmentCompletionInput,
  now = new Date(),
) {
  const startAt = getAppointmentStartAt(input);
  const completionAt = getAppointmentCompletionAt(input);

  if (!startAt || !completionAt) return false;

  const accessStartsAt = new Date(
    startAt.getTime() - MEETING_EARLY_ACCESS_MINUTES * 60 * 1000,
  );

  return now >= accessStartsAt && now <= completionAt;
}
