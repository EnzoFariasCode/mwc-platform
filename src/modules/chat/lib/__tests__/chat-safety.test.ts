import { describe, expect, it } from "vitest";
import {
  CHAT_MAX_CONTENT_LENGTH,
  canSendExternalContact,
  containsExternalContact,
  isBroadcastDuplicateLimitReached,
  isMessageTooLong,
  normalizeMessageContent,
} from "../chat-safety";

describe("chat safety policy", () => {
  it("normalizes whitespace before persistence and comparison", () => {
    expect(normalizeMessageContent("  ola   tudo\nbem?  ")).toBe(
      "ola tudo bem?",
    );
  });

  it("detects messages that exceed the maximum length", () => {
    expect(isMessageTooLong("a".repeat(CHAT_MAX_CONTENT_LENGTH))).toBe(false);
    expect(isMessageTooLong("a".repeat(CHAT_MAX_CONTENT_LENGTH + 1))).toBe(
      true,
    );
  });

  it("detects external contacts and links", () => {
    expect(containsExternalContact("me chama no email teste@site.com")).toBe(
      true,
    );
    expect(containsExternalContact("meu zap e 11999998888")).toBe(true);
    expect(containsExternalContact("portfolio https://example.com")).toBe(true);
    expect(containsExternalContact("podemos alinhar os detalhes aqui")).toBe(
      false,
    );
  });

  it("blocks external contact before paid project context", () => {
    expect(
      canSendExternalContact({
        content: "me chama no whatsapp",
        hasPaidContext: false,
      }),
    ).toBe(false);
  });

  it("allows external contact after paid project context", () => {
    expect(
      canSendExternalContact({
        content: "me chama no whatsapp",
        hasPaidContext: true,
      }),
    ).toBe(true);
  });

  it("blocks broadcast duplicates at the configured threshold", () => {
    expect(
      isBroadcastDuplicateLimitReached({
        previousCount: 2,
        limit: 3,
      }),
    ).toBe(false);
    expect(
      isBroadcastDuplicateLimitReached({
        previousCount: 3,
        limit: 3,
      }),
    ).toBe(true);
  });
});
