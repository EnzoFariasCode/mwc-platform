import { describe, expect, it } from "vitest";
import {
  canCompleteHealthAppointment,
  getAppointmentCompletionAt,
} from "./appointment-completion-time";

const appointment = {
  date: new Date("2026-07-15T00:00:00.000Z"),
  time: "10:00",
  timeZone: "America/Sao_Paulo",
  durationMinutes: 50,
};

describe("appointment completion time", () => {
  it("converts the Sao Paulo wall time and includes session duration", () => {
    expect(getAppointmentCompletionAt(appointment)?.toISOString()).toBe(
      "2026-07-15T13:50:00.000Z",
    );
  });

  it("blocks completion before the scheduled session ends", () => {
    expect(
      canCompleteHealthAppointment(
        appointment,
        new Date("2026-07-15T13:49:59.999Z"),
      ),
    ).toBe(false);
  });

  it("allows completion exactly when the scheduled session ends", () => {
    expect(
      canCompleteHealthAppointment(
        appointment,
        new Date("2026-07-15T13:50:00.000Z"),
      ),
    ).toBe(true);
  });

  it("rejects invalid time zones and durations", () => {
    expect(
      getAppointmentCompletionAt({ ...appointment, timeZone: "Invalid/Zone" }),
    ).toBeNull();
    expect(
      getAppointmentCompletionAt({ ...appointment, durationMinutes: 0 }),
    ).toBeNull();
  });

  it("handles a BRT session that ends on the next UTC day", () => {
    const completionAt = getAppointmentCompletionAt({
      date: new Date("2026-07-15T00:00:00.000Z"),
      time: "21:00",
      timeZone: "America/Sao_Paulo",
      durationMinutes: 60,
    });

    expect(completionAt?.toISOString()).toBe("2026-07-16T01:00:00.000Z");
  });

  it("uses the persisted professional time zone dynamically", () => {
    const completionAt = getAppointmentCompletionAt({
      ...appointment,
      timeZone: "America/Manaus",
    });

    expect(completionAt?.toISOString()).toBe("2026-07-15T14:50:00.000Z");
  });
});
