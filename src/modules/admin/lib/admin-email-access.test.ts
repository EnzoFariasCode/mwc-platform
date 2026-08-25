import { describe, expect, it } from "vitest";

import {
  adminEmailAccessWhere,
  canAdminAccessEmailMetadata,
} from "./admin-email-access";

describe("admin email access", () => {
  it("permite ao owner analisar todos os dominios", () => {
    expect(
      canAdminAccessEmailMetadata("OWNER", {
        eventType: "HEALTH_PAYMENT_CONFIRMED",
        entityType: "APPOINTMENT",
      }),
    ).toBe(true);
    expect(adminEmailAccessWhere("OWNER")).toEqual({});
  });

  it("separa mensagens financeiras das mensagens de suporte", () => {
    const financial = {
      eventType: "FINANCE_WITHDRAWAL_PAID",
      entityType: "WITHDRAWAL_REQUEST",
    };
    const support = {
      eventType: "ADMIN_CHAT_REPORT_DECISION_WARNING",
      entityType: "CHAT_REPORT",
    };

    expect(canAdminAccessEmailMetadata("FINANCE", financial)).toBe(true);
    expect(canAdminAccessEmailMetadata("FINANCE", support)).toBe(false);
    expect(canAdminAccessEmailMetadata("SUPPORT", financial)).toBe(false);
    expect(canAdminAccessEmailMetadata("SUPPORT", support)).toBe(true);
  });

  it("falha fechado quando o papel administrativo nao existe", () => {
    expect(
      canAdminAccessEmailMetadata(null, {
        eventType: "TECH_PROJECT_STARTED",
        entityType: "PROJECT",
      }),
    ).toBe(false);
    expect(adminEmailAccessWhere(null)).toEqual({
      id: "__ADMIN_EMAIL_ACCESS_DENIED__",
    });
  });
});
