import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Flag,
  MailWarning,
  ShieldCheck,
  Users,
  Wallet,
  Webhook,
} from "lucide-react";
import { ProjectStatus, WithdrawalStatus } from "@prisma/client";

import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { canAccessAdminRoles } from "@/modules/admin/lib/admin-permissions";
import { AdminPageHeader } from "@/modules/admin/components/AdminPageHeader";
import { AdminMetricCard } from "@/modules/admin/components/AdminMetricCard";

async function getAdminOverview() {
  const [
    totalUsers,
    activeUsers,
    professionals,
    openProjects,
    disputedProjects,
    disputedAppointments,
    pendingWithdrawals,
    meetingAttentionRequired,
    pendingCancellationReconciliations,
    pendingRescheduleReconciliations,
    pendingProfessionalVerifications,
    openChatReports,
    failedStripeEvents,
    emailAttentionRequired,
    latestStripeEvent,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isActive: true } }),
    db.user.count({ where: { userType: "PROFESSIONAL" } }),
    db.project.count({ where: { status: ProjectStatus.OPEN } }),
    db.project.count({ where: { status: ProjectStatus.DISPUTE } }),
    db.appointment.count({ where: { status: "DISPUTED" } }),
    db.withdrawalRequest.count({
      where: {
        status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING] },
      },
    }),
    db.appointment.count({ where: { status: "MEETING_REQUIRES_ATTENTION" } }),
    db.appointmentCancellationProcess.count({
      where: { status: "RECONCILIATION_REQUIRED" },
    }),
    db.appointmentRescheduleProcess.count({
      where: { status: "RECONCILIATION_REQUIRED" },
    }),
    db.professionalVerification.count({
      where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
    }),
    db.chatReport.count({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
    }),
    db.stripeEventLog.count({ where: { status: "FAILED" } }),
    db.emailOutbox.count({ where: { status: "REQUIRES_ATTENTION" } }),
    db.stripeEventLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, status: true, type: true },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    professionals,
    openProjects,
    disputedProjects,
    disputedAppointments,
    pendingWithdrawals,
    meetingAttentionRequired,
    pendingCancellationReconciliations,
    pendingRescheduleReconciliations,
    pendingProfessionalVerifications,
    openChatReports,
    failedStripeEvents,
    emailAttentionRequired,
    latestStripeEvent,
  };
}

export default async function AdminDashboardPage() {
  const admin = await requireAdminUser();
  const overview = await getAdminOverview();

  const cards = [
    {
      label: "Usuarios totais",
      value: overview.totalUsers,
      detail: `${overview.activeUsers} ativos`,
      icon: Users,
      tone: "brand" as const,
    },
    {
      label: "Profissionais",
      value: overview.professionals,
      detail: "Contas operacionais",
      icon: ShieldCheck,
      tone: "success" as const,
    },
    {
      label: "Projetos abertos",
      value: overview.openProjects,
      detail: "Disponiveis para propostas",
      icon: Briefcase,
      tone: "neutral" as const,
    },
    {
      label: "Saques pendentes",
      value: overview.pendingWithdrawals,
      detail: "Aguardando tesouraria",
      icon: Wallet,
      tone: "warning" as const,
    },
    {
      label: "Denuncias abertas",
      value: overview.openChatReports,
      detail: "Chat do Marketplace Tech",
      icon: Flag,
      tone: "danger" as const,
    },
    {
      label: "Webhook Stripe",
      value: overview.failedStripeEvents,
      detail: overview.latestStripeEvent
        ? `Ultimo: ${overview.latestStripeEvent.type} (${overview.latestStripeEvent.status})`
        : "Nenhum evento recebido",
      icon: Webhook,
      tone: overview.failedStripeEvents > 0 ? "danger" as const : "success" as const,
    },
    {
      label: "E-mails com falha",
      value: overview.emailAttentionRequired,
      detail: "Exigem analise administrativa",
      icon: MailWarning,
      tone: overview.emailAttentionRequired > 0 ? "danger" as const : "success" as const,
    },
  ];

  const shortcuts = [
    {
      title: "Usuarios",
      description: "Gerencie clientes, profissionais e contas administrativas.",
      href: "/dashboard/admin/usuarios",
      icon: Users,
      roles: ["OWNER", "SUPPORT"] as const,
    },
    {
      title: "Verificacoes",
      description: `${overview.pendingProfessionalVerifications} profissional(is) aguardam analise.`,
      href: "/dashboard/admin/verificacoes",
      icon: ShieldCheck,
      roles: ["OWNER", "SUPPORT"] as const,
    },
    {
      title: "Mediacao",
      description: `${overview.disputedProjects + overview.disputedAppointments} caso(s) em disputa agora.`,
      href: "/dashboard/admin/disputas",
      icon: AlertTriangle,
      roles: ["OWNER", "SUPPORT"] as const,
    },
    {
      title: "Denuncias do chat",
      description: `${overview.openChatReports} caso(s) aguardam conclusao administrativa.`,
      href: "/dashboard/admin/denuncias",
      icon: Flag,
      roles: ["OWNER", "FINANCE", "SUPPORT"] as const,
    },
    {
      title: "Tesouraria",
      description: "Analise solicitacoes de saque e registre comprovantes.",
      href: "/dashboard/admin/financeiro",
      icon: Wallet,
      roles: ["OWNER", "FINANCE"] as const,
    },
    {
      title: "Reconciliação Online",
      description: `${overview.meetingAttentionRequired + overview.pendingCancellationReconciliations + overview.pendingRescheduleReconciliations} operação(ões) exigem ação manual.`,
      href: "/dashboard/admin/reconciliacoes",
      icon: AlertTriangle,
      roles: ["OWNER", "FINANCE", "SUPPORT"] as const,
    },
    {
      title: "Operacao de e-mails",
      description: `${overview.emailAttentionRequired} envio(s) exigem atencao administrativa.`,
      href: "/dashboard/admin/emails",
      icon: MailWarning,
      roles: ["OWNER", "FINANCE", "SUPPORT"] as const,
    },
  ].filter((item) =>
    canAccessAdminRoles(admin.adminRole, [...item.roles]),
  );

  return (
    <PageContainer>
      <AdminPageHeader
        eyebrow="Administracao"
        title="Painel administrativo"
        description="Visao consolidada da operacao MWC para suporte, mediacao e financeiro."
        icon={ShieldCheck}
        actions={
          <div className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
            Perfil: <span className="font-semibold text-white">{admin.adminRole}</span>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <AdminMetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            detail={card.detail}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {shortcuts.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex min-h-32 flex-col rounded-xl border border-white/[0.08] bg-slate-900/70 p-4 transition-colors hover:border-[#d73cbe]/35 hover:bg-slate-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d73cbe]/10 text-[#e879d8]">
                <item.icon className="h-4 w-4" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-[#d73cbe]" />
            </div>
            <h2 className="text-sm font-semibold text-white">{item.title}</h2>
            <p className="mt-1.5 text-xs leading-5 text-slate-400">
              {item.description}
            </p>
          </Link>
        ))}
      </section>
    </PageContainer>
  );
}
