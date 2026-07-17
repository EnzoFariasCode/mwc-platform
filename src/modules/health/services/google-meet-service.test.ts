import { beforeEach, describe, expect, it, vi } from "vitest";

const calendarDelete = vi.hoisted(() => vi.fn());
const calendarInsert = vi.hoisted(() => vi.fn());
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
      events: { delete: calendarDelete, insert: calendarInsert },
    })),
    meet: vi.fn(() => ({
      spaces: { get: meetGet, patch: meetPatch },
    })),
  },
}));

import {
  cancelGoogleMeetEventIdempotently,
  createGoogleMeetEvent,
} from "./google-meet-service";

const meetEventParams = {
  summary: "Consulta",
  description: "Consulta online",
  startTime: new Date("2026-07-20T13:00:00.000Z"),
  endTime: new Date("2026-07-20T14:00:00.000Z"),
  attendees: ["patient@example.com", "professional@example.com"],
  requestId: "appointment-1",
};

describe("cancelGoogleMeetEventIdempotently", () => {
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

  it("removes the Calendar event when required OPEN access cannot be configured", async () => {
    vi.stubEnv("GOOGLE_MEET_ENFORCE_OPEN_ACCESS", "true");
    calendarInsert.mockResolvedValueOnce({
      data: {
        id: "event-2",
        hangoutLink: "https://meet.google.com/abc-defg-hij",
      },
    });
    meetGet.mockRejectedValueOnce({ response: { status: 403 } });
    calendarDelete.mockResolvedValueOnce({});

    await expect(createGoogleMeetEvent(meetEventParams)).resolves.toBeNull();
    expect(calendarDelete).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: "event-2" }),
    );
  });
});
