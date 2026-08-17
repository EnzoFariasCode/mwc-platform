import { beforeEach, describe, expect, it, vi } from "vitest";

const calendarDelete = vi.hoisted(() => vi.fn());
const calendarGet = vi.hoisted(() => vi.fn());
const calendarInsert = vi.hoisted(() => vi.fn());
const calendarPatch = vi.hoisted(() => vi.fn());
const meetGet = vi.hoisted(() => vi.fn());
const meetPatch = vi.hoisted(() => vi.fn());

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: class {
        setCredentials = vi.fn();
      },
    },
    calendar: vi.fn(() => ({
      events: {
        delete: calendarDelete,
        get: calendarGet,
        insert: calendarInsert,
        patch: calendarPatch,
      },
    })),
    meet: vi.fn(() => ({
      spaces: { get: meetGet, patch: meetPatch },
    })),
  },
}));

import {
  cancelGoogleMeetEventIdempotently,
  createGoogleMeetEvent,
  getGoogleMeetEvent,
  requestGoogleMeetConference,
} from "./google-meet-service";

const meetEventParams = {
  summary: "Consulta",
  description: "Consulta online",
  startTime: new Date("2026-07-20T13:00:00.000Z"),
  endTime: new Date("2026-07-20T14:00:00.000Z"),
  attendees: ["patient@example.com", "professional@example.com"],
  eventId: "mwc0123456789abcdef",
  requestId: "appointment-1",
};

describe("google-meet-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("GOOGLE_CALENDAR_CLIENT_ID", "client-id");
    vi.stubEnv("GOOGLE_CALENDAR_CLIENT_SECRET", "client-secret");
    vi.stubEnv("GOOGLE_CALENDAR_REFRESH_TOKEN", "refresh-token");
    vi.stubEnv("GOOGLE_MEET_ENFORCE_OPEN_ACCESS", "false");
  });

  it("treats an already deleted event as a successful cancellation", async () => {
    calendarDelete.mockRejectedValueOnce({ response: { status: 404 } });

    await expect(
      cancelGoogleMeetEventIdempotently("event-1"),
    ).resolves.toEqual({ status: "ALREADY_CANCELED" });
  });

  it("reports transient Google failures for retry", async () => {
    calendarDelete.mockRejectedValueOnce({ response: { status: 503 } });

    await expect(
      cancelGoogleMeetEventIdempotently("event-1"),
    ).resolves.toMatchObject({ status: "FAILED" });
  });

  it("configures Calendar-created spaces as OPEN when enforcement is enabled", async () => {
    vi.stubEnv("GOOGLE_MEET_ENFORCE_OPEN_ACCESS", "true");
    calendarInsert.mockResolvedValueOnce({
      data: {
        id: "event-1",
        hangoutLink: "https://meet.google.com/abc-defg-hij",
      },
    });
    meetGet.mockResolvedValueOnce({
      data: { name: "spaces/canonical-space", config: { accessType: "TRUSTED" } },
    });
    meetPatch.mockResolvedValueOnce({
      data: { config: { accessType: "OPEN" } },
    });

    await expect(createGoogleMeetEvent(meetEventParams)).resolves.toEqual({
      status: "READY",
      meetLink: "https://meet.google.com/abc-defg-hij",
      googleEventId: "event-1",
    });
    expect(meetPatch).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "spaces/canonical-space",
        updateMask: "config.accessType",
        requestBody: expect.objectContaining({
          config: { accessType: "OPEN" },
        }),
      }),
    );
  });

  it("keeps the Calendar event for retry when OPEN access cannot be configured", async () => {
    vi.stubEnv("GOOGLE_MEET_ENFORCE_OPEN_ACCESS", "true");
    calendarInsert.mockResolvedValueOnce({
      data: {
        id: "event-2",
        hangoutLink: "https://meet.google.com/abc-defg-hij",
      },
    });
    meetGet.mockRejectedValueOnce({ response: { status: 403 } });
    await expect(createGoogleMeetEvent(meetEventParams)).resolves.toEqual({
      status: "FAILED",
      googleEventId: "event-2",
      failureKind: "ACCESS_CONFIGURATION_FAILED",
      error: "Nao foi possivel configurar o acesso da sala Google Meet.",
    });
    expect(calendarDelete).not.toHaveBeenCalled();
  });

  it("persists the event identity when conference generation is pending", async () => {
    calendarInsert.mockResolvedValueOnce({
      data: {
        id: meetEventParams.eventId,
        conferenceData: {
          createRequest: { status: { statusCode: "pending" } },
        },
      },
    });

    await expect(createGoogleMeetEvent(meetEventParams)).resolves.toEqual({
      status: "PENDING",
      googleEventId: meetEventParams.eventId,
    });
    expect(calendarInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: expect.objectContaining({ id: meetEventParams.eventId }),
      }),
    );
  });

  it("polls the existing event until the conference is ready", async () => {
    calendarGet
      .mockResolvedValueOnce({
        data: {
          id: meetEventParams.eventId,
          conferenceData: {
            createRequest: { status: { statusCode: "pending" } },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: meetEventParams.eventId,
          hangoutLink: "https://meet.google.com/abc-defg-hij",
          conferenceData: {
            createRequest: { status: { statusCode: "success" } },
          },
        },
      });

    await expect(getGoogleMeetEvent(meetEventParams.eventId)).resolves.toEqual({
      status: "PENDING",
      googleEventId: meetEventParams.eventId,
    });
    await expect(getGoogleMeetEvent(meetEventParams.eventId)).resolves.toEqual({
      status: "READY",
      googleEventId: meetEventParams.eventId,
      meetLink: "https://meet.google.com/abc-defg-hij",
    });
    expect(calendarInsert).not.toHaveBeenCalled();
  });

  it("preserves the failed provider request id for a safe retry decision", async () => {
    calendarGet.mockResolvedValueOnce({
      data: {
        id: meetEventParams.eventId,
        conferenceData: {
          createRequest: {
            requestId: "failed-request-id",
            status: { statusCode: "failure" },
          },
        },
      },
    });

    await expect(getGoogleMeetEvent(meetEventParams.eventId)).resolves.toEqual({
      status: "FAILED",
      googleEventId: meetEventParams.eventId,
      providerRequestId: "failed-request-id",
      failureKind: "CONFERENCE_CREATION_FAILED",
      error: "O Google Calendar informou falha ao criar a conferencia.",
    });
  });

  it("recovers the deterministic event after a duplicate insert", async () => {
    calendarInsert.mockRejectedValueOnce({ response: { status: 409 } });
    calendarGet.mockResolvedValueOnce({
      data: {
        id: meetEventParams.eventId,
        hangoutLink: "https://meet.google.com/abc-defg-hij",
      },
    });

    await expect(createGoogleMeetEvent(meetEventParams)).resolves.toEqual({
      status: "READY",
      googleEventId: meetEventParams.eventId,
      meetLink: "https://meet.google.com/abc-defg-hij",
    });
    expect(calendarInsert).toHaveBeenCalledTimes(1);
    expect(calendarGet).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: meetEventParams.eventId }),
    );
  });

  it("requests a new conference on the same event with a new request id", async () => {
    calendarPatch.mockResolvedValueOnce({
      data: {
        id: meetEventParams.eventId,
        conferenceData: {
          createRequest: { status: { statusCode: "pending" } },
        },
      },
    });

    await expect(
      requestGoogleMeetConference({
        eventId: meetEventParams.eventId,
        requestId: "new-request-id",
      }),
    ).resolves.toEqual({
      status: "PENDING",
      googleEventId: meetEventParams.eventId,
    });
    expect(calendarPatch).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: meetEventParams.eventId,
        requestBody: {
          conferenceData: {
            createRequest: {
              requestId: "new-request-id",
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        },
      }),
    );
    expect(calendarInsert).not.toHaveBeenCalled();
  });
});
