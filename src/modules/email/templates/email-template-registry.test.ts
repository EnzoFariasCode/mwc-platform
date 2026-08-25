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

  it("renderiza notificacao Tech com conteudo escapado e link do painel", () => {
    const email = renderTransactionalEmailTemplate({
      templateKey: "tech.proposal.received",
      templateVersion: 1,
      payload: {
        recipientName: "Cliente <teste>",
        title: "Nova proposta recebida",
        preview: "Seu projeto recebeu uma proposta.",
        lines: ["Revise os dados antes de aceitar."],
        details: [{ label: "Projeto", value: "Site institucional" }],
        actionLabel: "Ver proposta",
        actionPath: "/dashboard/meus-projetos",
      },
    });

    expect(email.subject).toBe(
      "Maximus World Click - Nova proposta recebida",
    );
    expect(email.html).toContain("Cliente &lt;teste&gt;");
    expect(email.html).toContain("/dashboard/meus-projetos");
    expect(email.html).not.toContain("Cliente <teste>");
  });

  it("rejeita destino Tech fora do painel", () => {
    expect(() =>
      renderTransactionalEmailTemplate({
        templateKey: "tech.chat.unread",
        templateVersion: 1,
        payload: {
          recipientName: "Cliente",
          title: "Mensagem",
          preview: "Nova mensagem.",
          lines: ["Voce recebeu uma mensagem."],
          details: [],
          actionLabel: "Abrir",
          actionPath: "https://site-malicioso.example",
        },
      }),
    ).toThrow(EmailTemplatePayloadError);
  });
});
