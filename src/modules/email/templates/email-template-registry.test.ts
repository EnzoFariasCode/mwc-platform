import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  EmailTemplateNotFoundError,
  EmailTemplatePayloadError,
  renderTransactionalEmailTemplate,
} from "./email-template-registry";
import { TECH_EMAIL_TEMPLATE_KEYS } from "./tech-emails";
import { HEALTH_ONLINE_EMAIL_TEMPLATE_KEYS } from "./health-online-emails";
import { ADMIN_FINANCE_EMAIL_TEMPLATE_KEYS } from "./admin-finance-emails";

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

  it("renderiza boas-vindas com a marca da plataforma completa", () => {
    const email = renderTransactionalEmailTemplate({
      templateKey: "auth.welcome",
      templateVersion: 1,
      payload: {
        name: "Pessoa",
        userType: "PROFESSIONAL",
        industry: "HEALTH",
      },
    });

    expect(email.subject).toBe(
      "Maximus World Click - Bem-vindo a plataforma",
    );
    expect(email.text).toContain(
      "/agendar-consulta/dashboard-profissional",
    );
    expect(email.text).not.toContain("Sua conta na MWC Online");
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

  it("renderiza notificacao da MWC Online com destino interno", () => {
    const email = renderTransactionalEmailTemplate({
      templateKey: "health.appointment.confirmed",
      templateVersion: 1,
      payload: {
        recipientName: "Paciente <teste>",
        title: "Pagamento confirmado e consulta agendada",
        preview: "Seu pagamento foi confirmado.",
        lines: ["Sua consulta esta agendada."],
        details: [{ label: "Horario", value: "10:00" }],
        actionLabel: "Acompanhar consulta",
        actionPath: "/agendar-consulta/historico",
      },
    });

    expect(email.subject).toBe(
      "MWC Online - Pagamento confirmado e consulta agendada",
    );
    expect(email.html).toContain("Paciente &lt;teste&gt;");
    expect(email.html).toContain("/agendar-consulta/historico");
    expect(email.html).not.toContain("Paciente <teste>");
  });

  it("rejeita destino externo em notificacao da MWC Online", () => {
    expect(() =>
      renderTransactionalEmailTemplate({
        templateKey: "health.operational.attention",
        templateVersion: 1,
        payload: {
          recipientName: "Administrador",
          title: "Atencao necessaria",
          preview: "Uma operacao precisa ser revisada.",
          lines: ["Consulte o painel administrativo."],
          details: [],
          actionLabel: "Abrir",
          actionPath: "https://site-malicioso.example",
        },
      }),
    ).toThrow(EmailTemplatePayloadError);
  });

  it("renderiza e valida notificacao financeira com anexo protegido", () => {
    const email = renderTransactionalEmailTemplate({
      templateKey: "finance.withdrawal.paid",
      templateVersion: 1,
      payload: {
        recipientName: "Profissional <teste>",
        title: "Saque Pix pago",
        preview: "Seu saque foi pago.",
        lines: ["O comprovante esta anexado."],
        details: [{ label: "Valor", value: "R$ 100,00" }],
        actionLabel: "Abrir financeiro",
        actionPath: "/dashboard/financeiro",
        attachmentAuditLogId: "b889b566-b6c4-4c8f-81f8-a426098b9c45",
      },
    });

    expect(email.subject).toBe("Maximus World Click - Saque Pix pago");
    expect(email.html).toContain("Profissional &lt;teste&gt;");
    expect(email.html).toContain("/dashboard/financeiro");
  });

  it("rejeita link externo e identificador de anexo invalido no Admin", () => {
    expect(() =>
      renderTransactionalEmailTemplate({
        templateKey: "admin.critical.alert",
        templateVersion: 1,
        payload: {
          recipientName: "Admin",
          title: "Alerta",
          preview: "Revisao necessaria.",
          lines: ["Consulte o painel."],
          details: [],
          actionLabel: "Abrir",
          actionPath: "https://site-malicioso.example",
          attachmentAuditLogId: "invalido",
        },
      }),
    ).toThrow(EmailTemplatePayloadError);
  });

  it("valida destinatario, conteudo e link interno de todos os eventos transacionais", () => {
    const groups = [
      {
        keys: TECH_EMAIL_TEMPLATE_KEYS,
        actionPath: "/dashboard/chat",
      },
      {
        keys: HEALTH_ONLINE_EMAIL_TEMPLATE_KEYS,
        actionPath: "/agendar-consulta/historico",
      },
      {
        keys: ADMIN_FINANCE_EMAIL_TEMPLATE_KEYS,
        actionPath: "/dashboard/admin",
      },
    ] as const;

    for (const group of groups) {
      for (const templateKey of group.keys) {
        const rendered = renderTransactionalEmailTemplate({
          templateKey,
          templateVersion: 1,
          payload: {
            recipientName: "Pessoa destinataria",
            title: `Evento ${templateKey}`,
            preview: "Atualizacao transacional da plataforma.",
            lines: ["Confira os detalhes desta operacao."],
            details: [{ label: "Referencia", value: "MWC-123" }],
            actionLabel: "Acessar plataforma",
            actionPath: group.actionPath,
          },
        });

        expect(rendered.subject).toContain("Evento");
        expect(rendered.text).toContain("Pessoa destinataria");
        expect(rendered.text).toContain("https://");
        expect(rendered.html).toContain(group.actionPath);
        expect(rendered.html).not.toContain("javascript:");
      }
    }
  });
});
