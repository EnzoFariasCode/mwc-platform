import { describe, expect, it } from "vitest";
import { canStartClientRecordFromAppointment } from "./client-record-access-policy";

describe("acesso ao registro de atendimento", () => {
  it.each([
    "PAID",
    "MEETING_PENDING",
    "MEETING_REQUIRES_ATTENTION",
    "CONFIRMED",
    "RESCHEDULING",
    "COMPLETED",
    "NO_SHOW",
  ])("permite iniciar o registro para consulta vinculada em %s", (status) => {
    expect(canStartClientRecordFromAppointment(status)).toBe(true);
  });

  it.each([
    "PENDING_PAYMENT",
    "CANCELLING",
    "CANCELED",
    "REFUNDED",
    "DISPUTED",
    "MEETING_FAILED",
  ])("nao cria novo registro para consulta em %s", (status) => {
    expect(canStartClientRecordFromAppointment(status)).toBe(false);
  });
});
