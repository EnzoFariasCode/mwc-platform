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
}: MeetEventParams): Promise<string | null> {
  try {
    const calendar = getCalendarClient();
    const event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || DEFAULT_CALENDAR_ID,
      conferenceDataVersion: 1,
      requestBody: {
        summary,
        description,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: process.env.GOOGLE_CALENDAR_TIME_ZONE || DEFAULT_TIME_ZONE,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: process.env.GOOGLE_CALENDAR_TIME_ZONE || DEFAULT_TIME_ZONE,
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

    return event.data.hangoutLink || null;
  } catch (error) {
    console.error("[Google Meet API] Erro ao criar evento:", error);
    return null;
  }
}
