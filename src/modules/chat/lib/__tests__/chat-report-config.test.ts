import { describe, expect, it } from "vitest";

import {
  CHAT_REPORT_DESCRIPTION_MAX_LENGTH,
  CHAT_REPORT_DESCRIPTION_MIN_LENGTH,
  CHAT_REPORT_REASONS,
  isChatReportReason,
  normalizeChatReportDescription,
} from "../chat-report-config";

describe("chat report policy", () => {
  it("accepts only the reasons exposed by the report form", () => {
    for (const reason of CHAT_REPORT_REASONS) {
      expect(isChatReportReason(reason)).toBe(true);
    }

    expect(isChatReportReason("ACCOUNT_SUSPENSION")).toBe(false);
    expect(isChatReportReason(null)).toBe(false);
  });

  it("normalizes whitespace without changing the report meaning", () => {
    expect(
      normalizeChatReportDescription("  Mensagem   abusiva\n enviada ontem. "),
    ).toBe("Mensagem abusiva enviada ontem.");
  });

  it("keeps explicit, bounded report description limits", () => {
    expect(CHAT_REPORT_DESCRIPTION_MIN_LENGTH).toBe(20);
    expect(CHAT_REPORT_DESCRIPTION_MAX_LENGTH).toBe(3000);
  });
});
