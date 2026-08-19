import { describe, expect, it } from "vitest";
import {
  canPatientRequestAppointmentCancellation,
  isHealthAppointmentStatusCancellable,
} from "./appointment-cancellation-policy";

describe("politica de cancelamento de consultas Online", () => {
  it.each([
    "PAID",
    "MEETING_PENDING",
    "MEETING_REQUIRES_ATTENTION",
    "CONFIRMED",
  ])("permite solicitar cancelamento no estado %s", (status) => {
    expect(isHealthAppointmentStatusCancellable(status)).toBe(true);
  });

  it.each([
    "CANCELLING",
    "RESCHEDULING",
    "CANCELED",
    "COMPLETED",
    "REFUNDED",
    "NO_SHOW",
    "DISPUTED",
    "MEETING_FAILED",
  ])("nao permite solicitar cancelamento no estado %s", (status) => {
    expect(isHealthAppointmentStatusCancellable(status)).toBe(false);
  });

  it("considera o horario completo e permite cancelar uma consulta futura no mesmo dia", () => {
    const now = new Date("2026-08-19T10:00:00.000Z");
    const scheduledAt = new Date("2026-08-19T15:00:00.000Z");

    expect(
      canPatientRequestAppointmentCancellation({
        status: "MEETING_PENDING",
        scheduledAt,
        now,
      }),
    ).toBe(true);
  });

  it("impede cancelar consulta cujo horario ja passou", () => {
    const now = new Date("2026-08-19T16:00:00.000Z");
    const scheduledAt = new Date("2026-08-19T15:00:00.000Z");

    expect(
      canPatientRequestAppointmentCancellation({
        status: "CONFIRMED",
        scheduledAt,
        now,
      }),
    ).toBe(false);
  });
});
