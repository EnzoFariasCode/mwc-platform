import { describe, expect, it } from "vitest";
import {
  ADMIN_DECISION_REASON_MAX_LENGTH,
  validateAdminDecisionReason,
} from "../admin-decision-reason";

describe("admin decision reason", () => {
  it("rejects missing and short reasons", () => {
    expect(validateAdminDecisionReason()).toMatchObject({ success: false });
    expect(validateAdminDecisionReason(12345)).toMatchObject({
      success: false,
    });
    expect(validateAdminDecisionReason("curto")).toMatchObject({
      success: false,
    });
  });

  it("normalizes whitespace before validating and persisting", () => {
    expect(
      validateAdminDecisionReason("  Evidencia   revisada\ncom sucesso.  "),
    ).toEqual({
      success: true,
      value: "Evidencia revisada com sucesso.",
    });
  });

  it("rejects oversized audit payloads", () => {
    expect(
      validateAdminDecisionReason(
        "a".repeat(ADMIN_DECISION_REASON_MAX_LENGTH + 1),
      ),
    ).toMatchObject({ success: false });
  });
});
