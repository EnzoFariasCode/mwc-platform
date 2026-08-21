import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  EmailTemplateNotFoundError,
  EmailTemplatePayloadError,
  renderTransactionalEmailTemplate,
} from "./email-template-registry";

describe("email template registry", () => {
  it("renderiza um template versionado e deterministico", () => {
    const input = {
      templateKey: "system.smoke-test",
      templateVersion: 1,
      payload: { message: "Fila operacional." },
    } as const;

    const first = renderTransactionalEmailTemplate(input);
    const second = renderTransactionalEmailTemplate(input);

    expect(first).toEqual(second);
    expect(first.subject).toBe(
      "Maximus World Click - Teste do sistema de e-mails",
    );
    expect(first.html).toContain("Fila operacional.");
  });

  it("rejeita template ou versao nao registrados", () => {
    expect(() =>
      renderTransactionalEmailTemplate({
        templateKey: "unknown.template",
        templateVersion: 1,
        payload: {},
      }),
    ).toThrow(EmailTemplateNotFoundError);
  });

  it("rejeita payload com campos extras ou dados invalidos", () => {
    expect(() =>
      renderTransactionalEmailTemplate({
        templateKey: "system.smoke-test",
        templateVersion: 1,
        payload: { message: "Ok", secret: "nao permitido" },
      }),
    ).toThrow(EmailTemplatePayloadError);
  });
});
