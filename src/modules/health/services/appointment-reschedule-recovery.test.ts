import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const appointment = {
    id: "appointment-1",
    shortId: "MWC-1",
    date: new Date("2026-07-20T00:00:00.000Z"),
    time: "10:00",
    timezonePro: "America/Sao_Paulo",
    durationMinutes: 50,
    status: "RESCHEDULING",
    meetLink: "https://meet.google.com/abc-defg-hij",
    googleEventId: "event-1",
    professionalId: "professional-1",
    patientId: "patient-1",
    price: 100,
    notes: null as string | null,
    patient: { name: "Paciente", email: "patient@example.com" },
    professional: { name: "Profissional", email: "pro@example.com" },
  };
  const baseProcess = () => ({
    id: "reschedule-1",
    appointmentId: appointment.id,
    requestedById: appointment.professionalId,
    status: "PENDING",
    reservationId: "hold-1" as string | null,
    previousDate: appointment.date,
    previousTime: appointment.time,
    newDate: new Date("2026-07-22T00:00:00.000Z"),
    newTime: "14:00",
    attemptCount: 0,
    maxAttempts: 3,
    nextAttemptAt: new Date(0),
    processingStartedAt: null as Date | null,
    lastAttemptAt: null as Date | null,
    lastError: null as string | null,
    calendarStatus: "PENDING",
    calendarUpdatedAt: null as Date | null,
    calendarLastError: null as string | null,
    databaseStatus: "PENDING",
    databaseUpdatedAt: null as Date | null,
    databaseLastError: null as string | null,
    reconciliationRequiredAt: null as Date | null,
    reconciliationAlertedAt: null as Date | null,
    completedAt: null as Date | null,
    completionNotifiedAt: null as Date | null,
  });
  let process = baseProcess();
  let failDatabaseFinalization = true;

  const relatedProcess = () => ({ ...process, appointment: { ...appointment } });
  const processModel = {
    updateMany: vi.fn(async ({ where, data }) => {
      if (where.id !== process.id) return { count: 0 };
      if (where.OR && !["PENDING", "RETRY_SCHEDULED", "PROCESSING"].includes(process.status)) {
        return { count: 0 };
      }
      if (data.attemptCount?.increment) {
        process.attemptCount += data.attemptCount.increment;
      }
      process = { ...process, ...data, attemptCount: process.attemptCount };
      return { count: 1 };
    }),
    update: vi.fn(async ({ data }) => {
      process = { ...process, ...data };
      return relatedProcess();
    }),
    findUnique: vi.fn(async () => relatedProcess()),
    findUniqueOrThrow: vi.fn(async () => relatedProcess()),
    findMany: vi.fn(async () => [{ id: process.id }]),
  };
  const db = {
    appointmentRescheduleProcess: processModel,
    appointmentHold: {
      updateMany: vi.fn(async () => ({ count: 1 })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
    },
    appointment: {
      update: vi.fn(async ({ data }) => Object.assign(appointment, data)),
      findFirst: vi.fn(async () => null),
      updateMany: vi.fn(async ({ data }) => {
        if (failDatabaseFinalization) return { count: 0 };
        Object.assign(appointment, data);
        return { count: 1 };
      }),
    },
    user: { findMany: vi.fn(async () => []) },
    $transaction: vi.fn(async (callback) => callback(db)),
  };

  return {
    db,
    appointment,
    process: () => process,
    reset() {
      process = baseProcess();
      appointment.date = new Date("2026-07-20T00:00:00.000Z");
      appointment.time = "10:00";
      appointment.status = "RESCHEDULING";
      failDatabaseFinalization = true;
      vi.clearAllMocks();
    },
    allowDatabaseFinalization() {
      failDatabaseFinalization = false;
      process.nextAttemptAt = new Date(0);
    },
  };
});

const updateGoogleMeetEvent = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ db: mocks.db }));
vi.mock("@/modules/email/email-client", () => ({
  sendEmail: vi.fn(async () => ({ success: true })),
}));
vi.mock("@/modules/health/lib/appointment-completion-time", () => ({
  getAppointmentStartAt: vi.fn(() => new Date("2026-07-22T17:00:00.000Z")),
}));
vi.mock("@/modules/health/services/google-meet-service", () => ({
  findGoogleMeetEventForCancellation: vi.fn(),
  updateGoogleMeetEvent,
}));
vi.mock("@/modules/health/services/transactional-email-service", () => ({
  enqueueHealthOperationalAttentionEmail: vi.fn(),
  enqueueRescheduleEmail: vi.fn(),
}));
vi.mock("@/modules/notifications/services/notification-service", () => ({
  upsertNotification: vi.fn(),
}));

import { processAppointmentReschedule } from "./appointment-reschedule-recovery";

describe("appointment reschedule recovery", () => {
  beforeEach(() => {
    mocks.reset();
    updateGoogleMeetEvent.mockResolvedValue(true);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("retries only the database after Calendar was already updated", async () => {
    const first = await processAppointmentReschedule("reschedule-1");

    expect(first.status).toBe("PENDING");
    expect(mocks.process().calendarStatus).toBe("COMPLETED");
    expect(mocks.process().databaseStatus).toBe("PENDING");
    expect(updateGoogleMeetEvent).toHaveBeenCalledTimes(1);

    mocks.allowDatabaseFinalization();
    const second = await processAppointmentReschedule("reschedule-1");

    expect(second.status).toBe("COMPLETED");
    expect(mocks.appointment.status).toBe("CONFIRMED");
    expect(mocks.appointment.time).toBe("14:00");
    expect(updateGoogleMeetEvent).toHaveBeenCalledTimes(1);
  });
});
