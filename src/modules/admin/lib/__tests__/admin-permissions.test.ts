import { describe, expect, it } from "vitest";
import {
  allowedAdminRolesForArea,
  allowedAdminRolesForAuditEntity,
  canAccessAdminArea,
  canAccessAdminRoles,
  normalizeAdminRole,
} from "../admin-permissions";

describe("admin permissions", () => {
  it("denies ADMIN users without an explicit adminRole", () => {
    expect(
      normalizeAdminRole({
        userType: "ADMIN",
        adminRole: null,
      }),
    ).toBeNull();
  });

  it("does not assign adminRole to non-admin users", () => {
    expect(
      normalizeAdminRole({
        userType: "CLIENT",
        adminRole: "OWNER",
      }),
    ).toBeNull();
  });

  it("allows finance area only to OWNER and FINANCE", () => {
    expect(allowedAdminRolesForArea("FINANCE")).toEqual(["OWNER", "FINANCE"]);
    expect(canAccessAdminArea("OWNER", "FINANCE")).toBe(true);
    expect(canAccessAdminArea("FINANCE", "FINANCE")).toBe(true);
    expect(canAccessAdminArea("SUPPORT", "FINANCE")).toBe(false);
  });

  it("allows support areas only to OWNER and SUPPORT", () => {
    expect(canAccessAdminArea("OWNER", "DISPUTES")).toBe(true);
    expect(canAccessAdminArea("SUPPORT", "USERS")).toBe(true);
    expect(canAccessAdminArea("FINANCE", "DISPUTES")).toBe(false);
  });

  it("rejects empty or missing roles", () => {
    expect(canAccessAdminRoles(null, ["OWNER"])).toBe(false);
    expect(canAccessAdminRoles(undefined, ["OWNER"])).toBe(false);
  });

  it("isolates financial audit logs from SUPPORT", () => {
    const roles = allowedAdminRolesForAuditEntity("WITHDRAWAL_REQUEST");

    expect(roles).toEqual(["OWNER", "FINANCE"]);
    expect(canAccessAdminRoles("SUPPORT", roles)).toBe(false);
  });

  it("isolates support audit logs from FINANCE", () => {
    for (const entityType of [
      "TECH_PROJECT",
      "HEALTH_APPOINTMENT",
      "USER_ACCOUNT",
      "PROFESSIONAL_VERIFICATION",
    ]) {
      const roles = allowedAdminRolesForAuditEntity(entityType);
      expect(roles).toEqual(["OWNER", "SUPPORT"]);
      expect(canAccessAdminRoles("FINANCE", roles)).toBe(false);
    }
  });

  it("keeps reconciliation audit logs available to operational roles", () => {
    expect(
      allowedAdminRolesForAuditEntity("APPOINTMENT_CANCELLATION"),
    ).toEqual(["OWNER", "FINANCE", "SUPPORT"]);
    expect(
      allowedAdminRolesForAuditEntity("APPOINTMENT_RESCHEDULE"),
    ).toEqual(["OWNER", "FINANCE", "SUPPORT"]);
  });

  it("keeps chat report audit available to every ADMIN role", () => {
    expect(allowedAdminRolesForAuditEntity("CHAT_REPORT")).toEqual([
      "OWNER",
      "FINANCE",
      "SUPPORT",
    ]);
  });

  it("denies unknown audit entity types", () => {
    expect(allowedAdminRolesForAuditEntity("UNKNOWN_ENTITY")).toEqual([]);
  });
});
