import { describe, expect, it } from "vitest";
import {
  allowedAdminRolesForArea,
  canAccessAdminArea,
  canAccessAdminRoles,
  normalizeAdminRole,
} from "../admin-permissions";

describe("admin permissions", () => {
  it("treats legacy ADMIN users without adminRole as OWNER", () => {
    expect(
      normalizeAdminRole({
        userType: "ADMIN",
        adminRole: null,
      }),
    ).toBe("OWNER");
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
});
