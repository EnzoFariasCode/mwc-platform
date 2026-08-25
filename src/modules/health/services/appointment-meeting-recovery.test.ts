import { beforeEach, describe, expect, it, vi } from "vitest";

const appointmentFindUnique = vi.hoisted(() => vi.fn());
const appointmentFindMany = vi.hoisted(() => vi.fn());
const appointmentUpdateMany = vi.hoisted(() => vi.fn());
const appointmentMeetingAttemptCreate = vi.hoisted(() => vi.fn());
const userFindMany = vi.hoisted(() => vi.fn());
const stripeRefundCreate = vi.hoisted(() => vi.fn());
const stripeSessionRetrieve = vi.hoisted(() => vi.fn());
const transactionFindFirst = vi.hoisted(() => vi.fn());
const transactionUpdate = vi.hoisted(() => vi.fn());
const userUpdate = vi.hoisted(() => vi.fn());
const createGoogleMeetEvent = vi.hoisted(() => vi.fn());
const getGoogleMeetEvent = vi.hoisted(() => vi.fn());
const requestGoogleMeetConference = vi.hoisted(() => vi.fn());
const enqueuePaymentConfirmedEmails = vi.hoisted(() => vi.fn());
const upsertNotification = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  db: {
    appointment: {
      findUnique: appointmentFindUnique,
      findMany: appointmentFindMany,
      updateMany: appointmentUpdateMany,
    },
    appointmentMeetingAttempt: {
      create: appointmentMeetingAttemptCreate,
    },
    user: { findMany: userFindMany },
    $transaction: vi.fn(async (callback) =>
      callback({
        appointment: { updateMany: appointmentUpdateMany },
        appointmentMeetingAttempt: {
          create: appointmentMeetingAttemptCreate,
        },
        transaction: {
          findFirst: transactionFindFirst,
          update: transactionUpdate,
        },
        user: { update: userUpdate },
      }),
    ),
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: { sessions: { retrieve: stripeSessionRetrieve } },
    refunds: { create: stripeRefundCreate },
  },
}));

vi.mock("@/modules/health/services/google-meet-service", () => ({
  createGoogleMeetEvent,
  getGoogleMeetEvent,
  requestGoogleMeetConference,
}));

vi.mock("@/modules/health/services/transactional-email-service", () => ({
  enqueueHealthOperationalAttentionEmail: vi.fn(),
  enqueuePaymentConfirmedEmails,
}));

vi.mock("@/modules/notifications/services/notification-service", () => ({
  upsertNotification,
}));

vi.mock("@/modules/health/lib/appointment-completion-time", () => ({
  getAppointmentStartAt: vi.fn(() => new Date("2026-08-20T13:00:00.000Z")),
}));

import {
  processAppointmentMeeting,
  recoverPendingAppointmentMeetings,
} from "./appointment-meeting-recovery";

const currentAppointment = {
  status: "MEETING_PENDING",
  meetRetryCount: 0,
  meetLink: null,
  meetNextAttemptAt: null,
};

function persistedAppointment(googleEventId: string | null) {
  return {
    id: "appointment-1",
    status: "MEETING_PENDING",
    stripeSessionId: "cs_test_appointment_1",
    meetRetryCount: 0,
    googleEventId,
    meetRequestId: googleEventId ? "mwc-initial-request" : null,
    meetGenerationStatus: googleEventId ? "PENDING" : "NOT_STARTED",
    date: new Date("2026-08-20T00:00:00.000Z"),
    time: "10:00",
    durationMinutes: 50,
    timezonePro: "America/Sao_Paulo",
    price: 150,
    patientId: "patient-1",
    professionalId: "professional-1",
    patient: { name: "Paciente", email: "patient@example.com" },
    professional: {
      name: "Profissional",
      email: "professional@example.com",
    },
  };
}

describe("processAppointmentMeeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appointmentUpdateMany.mockResolvedValue({ count: 1 });
    appointmentFindMany.mockResolvedValue([]);
    enqueuePaymentConfirmedEmails.mockResolvedValue(undefined);
    upsertNotification.mockResolvedValue(undefined);
    userFindMany.mockResolvedValue([{ id: "admin-1" }]);
  });

  it("does not poll before the persisted next-attempt time", async () => {
    appointmentFindUnique.mockResolvedValueOnce({
      ...currentAppointment,
      meetNextAttemptAt: new Date(Date.now() + 60_000),
    });

    await expect(processAppointmentMeeting("appointment-1")).resolves.toEqual({
      status: "PENDING",
      appointmentId: "appointment-1",
    });

    expect(appointmentUpdateMany).not.toHaveBeenCalled();
    expect(createGoogleMeetEvent).not.toHaveBeenCalled();
    expect(getGoogleMeetEvent).not.toHaveBeenCalled();
  });

  it("selects only meetings whose persisted next-attempt time has expired", async () => {
    await expect(recoverPendingAppointmentMeetings()).resolves.toEqual({
      processed: 0,
      recovered: 0,
      confirmed: 0,
      pending: 0,
      requiresAttention: 0,
      failed: 0,
    });

    expect(appointmentFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            status: "MEETING_PENDING",
            meetNextAttemptAt: { lte: expect.any(Date) },
          },
          {
            status: "MEETING_REQUIRES_ATTENTION",
            meetAttentionAlertedAt: null,
            meetNextAttemptAt: { lte: expect.any(Date) },
          },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 25,
      select: { id: true },
    });
  });

  it("persists a newly created event and keeps pending conferences retry-free", async () => {
    appointmentFindUnique
      .mockResolvedValueOnce(currentAppointment)
      .mockResolvedValueOnce(persistedAppointment(null));
    createGoogleMeetEvent.mockResolvedValueOnce({
      status: "PENDING",
      googleEventId: "mwc0123456789abcdef",
    });

    await expect(processAppointmentMeeting("appointment-1")).resolves.toEqual({
      status: "PENDING",
      appointmentId: "appointment-1",
    });

    expect(createGoogleMeetEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: expect.stringMatching(/^mwc[0-9a-f]{40}$/),
        requestId: expect.stringMatching(/^mwc-[0-9a-f]{24}$/),
      }),
    );
    expect(getGoogleMeetEvent).not.toHaveBeenCalled();

    const persistence = appointmentUpdateMany.mock.calls[1][0];
    expect(persistence.data).toMatchObject({
      googleEventId: "mwc0123456789abcdef",
      meetRequestId: expect.stringMatching(/^mwc-[0-9a-f]{24}$/),
      meetGenerationStatus: "PENDING",
      meetProcessingStartedAt: null,
      meetLastError: null,
    });
    expect(persistence.data).not.toHaveProperty("meetRetryCount");
    expect(appointmentMeetingAttemptCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        operation: "CREATE_EVENT",
        outcome: "PENDING",
      }),
    });
  });

  it("polls the persisted event instead of creating another one", async () => {
    appointmentFindUnique
      .mockResolvedValueOnce(currentAppointment)
      .mockResolvedValueOnce(persistedAppointment("event-1"));
    getGoogleMeetEvent.mockResolvedValueOnce({
      status: "READY",
      googleEventId: "event-1",
      meetLink: "https://meet.google.com/abc-defg-hij",
    });

    await expect(processAppointmentMeeting("appointment-1")).resolves.toEqual({
      status: "CONFIRMED",
      appointmentId: "appointment-1",
    });

    expect(getGoogleMeetEvent).toHaveBeenCalledWith("event-1");
    expect(createGoogleMeetEvent).not.toHaveBeenCalled();
    expect(appointmentUpdateMany.mock.calls[1][0].data).toMatchObject({
      status: "CONFIRMED",
      googleEventId: "event-1",
      meetLink: "https://meet.google.com/abc-defg-hij",
      meetGenerationStatus: "READY",
      meetNextAttemptAt: null,
      meetProcessingStartedAt: null,
      meetLastError: null,
    });
  });

  it("requests a fresh conference on the same event after an explicit Google failure", async () => {
    appointmentFindUnique
      .mockResolvedValueOnce(currentAppointment)
      .mockResolvedValueOnce({
        ...persistedAppointment("event-1"),
        meetRequestId: "mwc-retry-failed-request",
        meetGenerationStatus: "RETRY_SCHEDULED",
      });
    getGoogleMeetEvent.mockResolvedValueOnce({
      status: "FAILED",
      googleEventId: "event-1",
      providerRequestId: "mwc-retry-failed-request",
      failureKind: "CONFERENCE_CREATION_FAILED",
      error: "Conference generation failed.",
    });
    requestGoogleMeetConference.mockResolvedValueOnce({
      status: "PENDING",
      googleEventId: "event-1",
    });

    await expect(processAppointmentMeeting("appointment-1")).resolves.toEqual({
      status: "PENDING",
      appointmentId: "appointment-1",
    });

    expect(requestGoogleMeetConference).toHaveBeenCalledWith({
      eventId: "event-1",
      requestId: expect.stringMatching(/^mwc-retry-/),
    });
    expect(
      requestGoogleMeetConference.mock.calls[0][0].requestId,
    ).not.toBe("mwc-retry-failed-request");
    expect(createGoogleMeetEvent).not.toHaveBeenCalled();
    expect(appointmentUpdateMany.mock.calls[2][0].data).toMatchObject({
      googleEventId: "event-1",
      meetGenerationStatus: "PENDING",
      meetProcessingStartedAt: null,
    });
    expect(appointmentMeetingAttemptCreate).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        operation: "POLL_EVENT",
        outcome: "FAILED",
        providerStatus: "CONFERENCE_CREATION_FAILED",
      }),
    });
    expect(appointmentMeetingAttemptCreate).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        operation: "RETRY_CONFERENCE",
        outcome: "PENDING",
      }),
    });
  });

  it("reuses a persisted retry request after a crash before the Google patch", async () => {
    appointmentFindUnique
      .mockResolvedValueOnce(currentAppointment)
      .mockResolvedValueOnce({
        ...persistedAppointment("event-1"),
        meetRequestId: "mwc-retry-persisted-request",
        meetGenerationStatus: "RETRY_SCHEDULED",
      });
    getGoogleMeetEvent.mockResolvedValueOnce({
      status: "FAILED",
      googleEventId: "event-1",
      providerRequestId: "previous-provider-request",
      failureKind: "CONFERENCE_CREATION_FAILED",
      error: "Previous conference generation failed.",
    });
    requestGoogleMeetConference.mockResolvedValueOnce({
      status: "PENDING",
      googleEventId: "event-1",
    });

    await processAppointmentMeeting("appointment-1");

    expect(requestGoogleMeetConference).toHaveBeenCalledWith({
      eventId: "event-1",
      requestId: "mwc-retry-persisted-request",
    });
  });

  it("escalates after the attempt limit without requesting a refund", async () => {
    appointmentFindUnique
      .mockResolvedValueOnce({
        ...currentAppointment,
        meetRetryCount: 5,
      })
      .mockResolvedValueOnce({
        id: "appointment-1",
        status: "MEETING_PENDING",
        professionalId: "professional-1",
        patientId: "patient-1",
        meetLastError: "Temporary provider error",
      });

    await expect(processAppointmentMeeting("appointment-1")).resolves.toEqual({
      status: "REQUIRES_ATTENTION",
      appointmentId: "appointment-1",
    });

    expect(appointmentUpdateMany).toHaveBeenCalledWith({
      where: { id: "appointment-1", status: "MEETING_PENDING" },
      data: {
        status: "MEETING_REQUIRES_ATTENTION",
        meetGenerationStatus: "REQUIRES_ATTENTION",
        meetNextAttemptAt: expect.any(Date),
        meetProcessingStartedAt: null,
        meetAttentionRequiredAt: expect.any(Date),
        meetAttentionAlertedAt: null,
      },
    });
    expect(stripeSessionRetrieve).not.toHaveBeenCalled();
    expect(stripeRefundCreate).not.toHaveBeenCalled();
    expect(transactionFindFirst).not.toHaveBeenCalled();
    expect(transactionUpdate).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
    expect(createGoogleMeetEvent).not.toHaveBeenCalled();
  });
});
