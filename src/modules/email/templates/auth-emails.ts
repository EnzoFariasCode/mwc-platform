import { actionButton, baseEmail, paragraph } from "./base-email";

export function resetPasswordEmail(code: string) {
  const subject = "MWC Online - Codigo de recuperacao de senha";
  const text = [
    "Recebemos uma solicitacao para redefinir sua senha.",
    "",
    `Seu codigo de verificacao e: ${code}`,
    "",
    "Esse codigo expira em 15 minutos.",
    "Se voce nao solicitou, ignore este e-mail.",
  ].join("\n");

  const html = baseEmail({
    title: "Recuperacao de senha",
    preview: "Use o codigo para redefinir sua senha na MWC Online.",
    children: [
      paragraph("Recebemos uma solicitacao para redefinir sua senha."),
      `<div style="margin:18px 0 22px;padding:18px;border-radius:14px;background:#020617;border:1px solid #1e293b;text-align:center;color:#ffffff;font-size:30px;font-weight:800;letter-spacing:.18em;">${code}</div>`,
      paragraph("Esse codigo expira em 15 minutos."),
      paragraph("Se voce nao solicitou, ignore este e-mail."),
    ].join(""),
  });

  return { subject, text, html };
}

export function welcomeEmail({
  name,
  userType,
  industry,
  appUrl,
}: {
  name: string | null;
  userType: "CLIENT" | "PROFESSIONAL" | "ADMIN";
  industry: "TECH" | "HEALTH";
  appUrl: string;
}) {
  const isProfessional = userType === "PROFESSIONAL";
  const isHealth = industry === "HEALTH";
  const dashboardUrl = isProfessional
    ? isHealth
      ? `${appUrl}/agendar-consulta/dashboard-profissional`
      : `${appUrl}/dashboard/profissional`
    : `${appUrl}/dashboard/cliente`;
  const subject = "MWC Online - Bem-vindo a plataforma";
  const greeting = `Ola, ${name || "usuario"}.`;
  const nextStep = isProfessional
    ? "Complete seu perfil profissional para aparecer nas buscas e receber oportunidades."
    : "Voce ja pode procurar profissionais, criar pedidos e conversar pelo chat.";

  const text = [
    greeting,
    "",
    "Sua conta na MWC Online foi criada com sucesso.",
    nextStep,
    "",
    `Acessar painel: ${dashboardUrl}`,
  ].join("\n");

  const html = baseEmail({
    title: "Bem-vindo a MWC Online",
    preview: "Sua conta foi criada com sucesso.",
    children: [
      paragraph(greeting),
      paragraph("Sua conta na MWC Online foi criada com sucesso."),
      paragraph(nextStep),
      actionButton("Acessar meu painel", dashboardUrl),
    ].join(""),
  });

  return { subject, text, html };
}
