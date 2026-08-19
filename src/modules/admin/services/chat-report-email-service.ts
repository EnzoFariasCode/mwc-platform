import "server-only";

import { sendEmail } from "@/modules/email/email-client";

type ReportParty = {
  name: string;
  email: string;
};

export async function sendChatReportDecisionEmails({
  reportId,
  decision,
  reason,
  reporter,
  reportedUser,
}: {
  reportId: string;
  decision: "WARNING" | "NO_PENALTY";
  reason: string;
  reporter: ReportParty;
  reportedUser: ReportParty;
}) {
  const reference = reportId.slice(0, 8).toUpperCase();

  if (decision === "WARNING") {
    return Promise.all([
      sendEmail({
        to: reportedUser.email,
        subject: `MWC - advertencia de conduta (${reference})`,
        text: [
          `Ola, ${reportedUser.name}.`,
          "A equipe administrativa analisou uma denuncia relacionada a uma conversa no Marketplace Tech e emitiu uma advertencia de conduta.",
          `Justificativa: ${reason}`,
          "A comunicacao entre as contas permanece bloqueada. Responda pelos canais oficiais de suporte caso precise de esclarecimentos.",
        ].join("\n\n"),
        logPrefix: "CHAT_REPORT_WARNING_REPORTED_USER",
      }),
      sendEmail({
        to: reporter.email,
        subject: `MWC - denuncia analisada (${reference})`,
        text: [
          `Ola, ${reporter.name}.`,
          "Sua denuncia no Marketplace Tech foi analisada e uma advertencia foi emitida.",
          `Conclusao administrativa: ${reason}`,
          "A comunicacao entre as contas permanece bloqueada.",
        ].join("\n\n"),
        logPrefix: "CHAT_REPORT_WARNING_REPORTER",
      }),
    ]);
  }

  return Promise.all([
    sendEmail({
      to: reporter.email,
      subject: `MWC - denuncia encerrada (${reference})`,
      text: [
        `Ola, ${reporter.name}.`,
        "Sua denuncia no Marketplace Tech foi analisada e encerrada sem penalidade administrativa para a conta denunciada.",
        `Conclusao administrativa: ${reason}`,
        "Por seguranca, o bloqueio de comunicacao entre as contas permanece ativo.",
      ].join("\n\n"),
      logPrefix: "CHAT_REPORT_NO_PENALTY_REPORTER",
    }),
    sendEmail({
      to: reportedUser.email,
      subject: `MWC - analise de denuncia encerrada (${reference})`,
      text: [
        `Ola, ${reportedUser.name}.`,
        "Uma denuncia relacionada a uma conversa no Marketplace Tech foi encerrada sem penalidade administrativa para sua conta.",
        `Conclusao administrativa: ${reason}`,
        "O bloqueio de comunicacao entre as contas permanece ativo.",
      ].join("\n\n"),
      logPrefix: "CHAT_REPORT_NO_PENALTY_REPORTED_USER",
    }),
  ]);
}
