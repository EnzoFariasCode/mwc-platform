import { google } from "googleapis";

const DEFAULT_CALENDAR_ID = "primary";
const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

type GoogleMeetEventAttendee = {
  email: string;
};

interface MeetEventParams {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  requestId: string;
}

type GoogleMeetEventResult = {
  meetLink: string;
  googleEventId: string;
};

interface UpdateMeetEventParams {
  eventId: string;
  summary?: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
}

interface FindMeetEventParams {
  meetLink: string;
  startTime: Date;
  endTime: Date;
}

export type GoogleMeetLookupResult =
  | { status: "FOUND"; eventId: string }
  | { status: "NOT_FOUND" }
  | { status: "FAILED"; error: string };

export type GoogleMeetCancellationResult =
  | { status: "CANCELED" | "ALREADY_CANCELED" }
  | { status: "FAILED"; error: string };

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variavel de ambiente ${name} nao configurada.`);
  }

  return value;
}

function getCalendarClient() {
  return google.calendar({ version: "v3", auth: getGoogleAuthClient() });
}

function getGoogleAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    requiredEnv("GOOGLE_CALENDAR_CLIENT_ID"),
    requiredEnv("GOOGLE_CALENDAR_CLIENT_SECRET"),
  );

  oauth2Client.setCredentials({
    refresh_token: requiredEnv("GOOGLE_CALENDAR_REFRESH_TOKEN"),
  });

  return oauth2Client;
}

function shouldEnforceOpenMeetAccess() {
  return process.env.GOOGLE_MEET_ENFORCE_OPEN_ACCESS === "true";
}

function getMeetingCode(meetLink: string) {
  try {
    const url = new URL(meetLink);
    if (url.protocol !== "https:" || url.hostname !== "meet.google.com") {
      return null;
    }

    const [meetingCode] = url.pathname.split("/").filter(Boolean);
    return meetingCode || null;
  } catch {
    return null;
  }
}

async function enforceOpenMeetAccess(meetLink: string) {
  if (!shouldEnforceOpenMeetAccess()) return true;

  const meetingCode = getMeetingCode(meetLink);
  if (!meetingCode) return false;

  try {
    const meet = google.meet({ version: "v2", auth: getGoogleAuthClient() });
    const currentSpace = await meet.spaces.get({
      name: `spaces/${meetingCode}`,
    });
    const spaceName = currentSpace.data.name;

    if (!spaceName) return false;
    if (currentSpace.data.config?.accessType === "OPEN") return true;

    const updatedSpace = await meet.spaces.patch({
      name: spaceName,
      updateMask: "config.accessType",
      requestBody: {
        name: spaceName,
        config: { accessType: "OPEN" },
      },
    });

    return updatedSpace.data.config?.accessType === "OPEN";
  } catch (error) {
    console.error("[Google Meet API] Erro ao configurar acesso aberto:", error);
    return false;
  }
}

function getCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID || DEFAULT_CALENDAR_ID;
}

function getCalendarTimeZone() {
  return process.env.GOOGLE_CALENDAR_TIME_ZONE || DEFAULT_TIME_ZONE;
}

function normalizeAttendees(attendees: string[]): GoogleMeetEventAttendee[] {
  return attendees
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
    .filter((email, index, list) => list.indexOf(email) === index)
    .map((email) => ({ email }));
}

function normalizeMeetLink(meetLink: string) {
  return meetLink.trim().replace(/\/+$/, "").toLowerCase();
}

function eventHasMeetLink(
  event: {
    hangoutLink?: string | null;
    conferenceData?: {
      entryPoints?: Array<{ uri?: string | null }>;
    } | null;
  },
  meetLink: string,
) {
  const normalizedMeetLink = normalizeMeetLink(meetLink);
  const eventLinks = [
    event.hangoutLink,
    ...(event.conferenceData?.entryPoints?.map((entry) => entry.uri) ?? []),
  ];

  return eventLinks.some(
    (link) => link && normalizeMeetLink(link) === normalizedMeetLink,
  );
}

function externalErrorStatus(error: unknown) {
  if (!error || typeof error !== "object") return null;

  const candidate = error as {
    code?: unknown;
    response?: { status?: unknown };
  };
  const value = candidate.response?.status ?? candidate.code;
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
}

export async function createGoogleMeetEvent({
  summary,
  description,
  startTime,
  endTime,
  attendees,
  requestId,
}: MeetEventParams): Promise<GoogleMeetEventResult | null> {
  try {
    const calendar = getCalendarClient();
    const event = await calendar.events.insert({
      calendarId: getCalendarId(),
      conferenceDataVersion: 1,
      sendUpdates: "all",
      requestBody: {
        summary,
        description,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: getCalendarTimeZone(),
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: getCalendarTimeZone(),
        },
        attendees: normalizeAttendees(attendees),
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    if (!event.data.hangoutLink || !event.data.id) {
      return null;
    }

    const openAccessConfigured = await enforceOpenMeetAccess(
      event.data.hangoutLink,
    );

    if (!openAccessConfigured) {
      // Evita manter um evento sem uso quando a politica OPEN e obrigatoria.
      await cancelGoogleMeetEventIdempotently(event.data.id);
      return null;
    }

    return {
      meetLink: event.data.hangoutLink,
      googleEventId: event.data.id,
    };
  } catch (error) {
    console.error("[Google Meet API] Erro ao criar evento:", error);
    return null;
  }
}

export async function updateGoogleMeetEvent({
  eventId,
  summary,
  description,
  startTime,
  endTime,
  attendees,
}: UpdateMeetEventParams): Promise<boolean> {
  try {
    const calendar = getCalendarClient();
    await calendar.events.patch({
      calendarId: getCalendarId(),
      eventId,
      sendUpdates: "all",
      requestBody: {
        ...(summary ? { summary } : {}),
        ...(description ? { description } : {}),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: getCalendarTimeZone(),
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: getCalendarTimeZone(),
        },
        ...(attendees ? { attendees: normalizeAttendees(attendees) } : {}),
      },
    });

    return true;
  } catch (error) {
    console.error("[Google Meet API] Erro ao atualizar evento:", error);
    return false;
  }
}

export async function findGoogleMeetEventId({
  meetLink,
  startTime,
  endTime,
}: FindMeetEventParams): Promise<string | null> {
  const result = await findGoogleMeetEventForCancellation({
    meetLink,
    startTime,
    endTime,
  });

  return result.status === "FOUND" ? result.eventId : null;
}

export async function findGoogleMeetEventForCancellation({
  meetLink,
  startTime,
  endTime,
}: FindMeetEventParams): Promise<GoogleMeetLookupResult> {
  try {
    const calendar = getCalendarClient();
    const searchStart = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
    const searchEnd = new Date(endTime.getTime() + 24 * 60 * 60 * 1000);
    const events = await calendar.events.list({
      calendarId: getCalendarId(),
      singleEvents: true,
      timeMin: searchStart.toISOString(),
      timeMax: searchEnd.toISOString(),
      maxResults: 50,
    });

    const matchingEvent = events.data.items?.find((event) =>
      eventHasMeetLink(event, meetLink),
    );

    return matchingEvent?.id
      ? { status: "FOUND", eventId: matchingEvent.id }
      : { status: "NOT_FOUND" };
  } catch (error) {
    console.error("[Google Meet API] Erro ao localizar evento:", error);
    return {
      status: "FAILED",
      error: "Falha ao consultar o evento no Google Calendar.",
    };
  }
}

export async function cancelGoogleMeetEvent(
  eventId: string,
): Promise<boolean> {
  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({
      calendarId: getCalendarId(),
      eventId,
      sendUpdates: "all",
    });

    return true;
  } catch (error) {
    console.error("[Google Meet API] Erro ao cancelar evento:", error);
    return false;
  }
}

export async function cancelGoogleMeetEventIdempotently(
  eventId: string,
): Promise<GoogleMeetCancellationResult> {
  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({
      calendarId: getCalendarId(),
      eventId,
      sendUpdates: "all",
    });

    return { status: "CANCELED" };
  } catch (error) {
    const status = externalErrorStatus(error);

    if (status === 404 || status === 410) {
      return { status: "ALREADY_CANCELED" };
    }

    console.error(
      "[Google Meet API] Erro ao cancelar evento de forma idempotente:",
      error,
    );
    return {
      status: "FAILED",
      error: "Falha ao cancelar o evento no Google Calendar.",
    };
  }
}
