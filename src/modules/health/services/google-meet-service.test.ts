import { beforeEach, describe, expect, it, vi } from "vitest";

const calendarDelete = vi.hoisted(() => vi.fn());

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: class {
        setCredentials = vi.fn();
      },
    },
    calendar: vi.fn(() => ({ events: { delete: calendarDelete } })),
  },
}));

import { cancelGoogleMeetEventIdempotently } from "./google-meet-service";

describe("cancelGoogleMeetEventIdempotently", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("GOOGLE_CALENDAR_CLIENT_ID", "client-id");
    vi.stubEnv("GOOGLE_CALENDAR_CLIENT_SECRET", "client-secret");
    vi.stubEnv("GOOGLE_CALENDAR_REFRESH_TOKEN", "refresh-token");
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
});
