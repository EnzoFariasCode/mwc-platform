import { describe, it, expect } from "vitest";
import { parseAppointmentDateTime, generateDaySlots } from "../slot-helpers";

describe("payment-actions helpers", () => {
  it("parseAppointmentDateTime returns correct objects for valid input", () => {
    const res = parseAppointmentDateTime("2026-05-27", "08:30");
    expect(res).not.toBeNull();
    if (res) {
      expect(res.dateOnly.toISOString().startsWith("2026-05-27")).toBe(true);
      expect(res.dateTime.getHours()).toBe(8);
      expect(res.dateTime.getMinutes()).toBe(30);
    }
  });

  it("parseAppointmentDateTime returns null for invalid input", () => {
    expect(parseAppointmentDateTime("2026-02-30", "08:30")).toBeNull();
    expect(parseAppointmentDateTime("2026-05-27", "25:00")).toBeNull();
    expect(parseAppointmentDateTime("not-a-date", "not-a-time")).toBeNull();
  });

  it("generateDaySlots produces aligned slots and excludes partial final slot", () => {
    const baseDate = new Date(2026, 4, 27); // May 27 2026 (month is 0-based)
    const slots = generateDaySlots("08:00", "10:00", baseDate, 50);
    // Expect two slots: 08:00 and 08:50 (09:40 + 50 => 10:30 > end -> excluded)
    expect(slots).toEqual(["08:00", "08:50"]);
  });

  it("generateDaySlots supports exact-fit final slot", () => {
    const baseDate = new Date(2026, 4, 27);
    const slots1 = generateDaySlots("08:00", "09:40", baseDate, 50);
    expect(slots1).toEqual(["08:00", "08:50"]);

    const slots2 = generateDaySlots("08:00", "10:30", baseDate, 50);
    expect(slots2).toEqual(["08:00", "08:50", "09:40"]);
  });
});
