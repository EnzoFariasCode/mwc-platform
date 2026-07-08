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

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variavel de ambiente ${name} nao configurada.`);
  }

  return value;
}

function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    requiredEnv("GOOGLE_CALENDAR_CLIENT_ID"),
    requiredEnv("GOOGLE_CALENDAR_CLIENT_SECRET"),
  );

  oauth2Client.setCredentials({
    refresh_token: requiredEnv("GOOGLE_CALENDAR_REFRESH_TOKEN"),
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
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
