import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Flag,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { ProjectStatus, WithdrawalStatus } from "@prisma/client";

import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { PageContainer } from "@/modules/dashboard/components/PageContainer";

async function getAdminOverview() {
  const [
    totalUsers,
    activeUsers,
    professionals,
    openProjects,
    disputedProjects,
    pendingWithdrawals,
    pendingCancellationReconciliations,
    pendingRescheduleReconciliations,
    pendingProfessionalVerifications,
    openChatReports,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isActive: true } }),
    db.user.count({ where: { userType: "PROFESSIONAL" } }),
    db.project.count({ where: { status: ProjectStatus.OPEN } }),
    db.project.count({ where: { status: ProjectStatus.DISPUTE } }),
    db.withdrawalRequest.count({
      where: { status: WithdrawalStatus.PENDING },
    }),
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
  ]);

  return {
    totalUsers,
    activeUsers,
    professionals,
    openProjects,
    disputedProjects,
    pendingWithdrawals,
    pendingCancellationReconciliations,
    pendingRescheduleReconciliations,
    pendingProfessionalVerifications,
    openChatReports,
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
    },
    {
      label: "Profissionais",
      value: overview.professionals,
      detail: "Contas operacionais",
      icon: ShieldCheck,
    },
    {
      label: "Projetos abertos",
      value: overview.openProjects,
      detail: "Disponiveis para propostas",
      icon: Briefcase,
    },
    {
      label: "Saques pendentes",
      value: overview.pendingWithdrawals,
      detail: "Aguardando tesouraria",
      icon: Wallet,
    },
    {
      label: "Denuncias abertas",
      value: overview.openChatReports,
      detail: "Chat do Marketplace Tech",
      icon: Flag,
    },
  ];

  const shortcuts = [
    {
      title: "Usuarios",
      description: "Gerencie clientes, profissionais e contas administrativas.",
      href: "/dashboard/admin/usuarios",
      icon: Users,
    },
    ...(admin.adminRole !== "FINANCE"
      ? [
          {
            title: "Verificacoes",
            description: `${overview.pendingProfessionalVerifications} profissional(is) aguardam analise.`,
            href: "/dashboard/admin/verificacoes",
            icon: ShieldCheck,
          },
        ]
      : []),
    {
      title: "Mediacao",
      description: `${overview.disputedProjects} projeto(s) em disputa agora.`,
      href: "/dashboard/admin/disputas",
      icon: AlertTriangle,
    },
    {
      title: "Denuncias do chat",
      description: `${overview.openChatReports} caso(s) aguardam conclusao administrativa.`,
      href: "/dashboard/admin/denuncias",
      icon: Flag,
    },
    {
      title: "Tesouraria",
      description: "Analise solicitacoes de saque e registre comprovantes.",
      href: "/dashboard/admin/financeiro",
      icon: Wallet,
    },
    {
      title: "Reconciliação Online",
      description: `${overview.pendingCancellationReconciliations + overview.pendingRescheduleReconciliations} operação(ões) exigem ação manual.`,
      href: "/dashboard/admin/reconciliacoes",
      icon: AlertTriangle,
    },
  ];

  return (
    <PageContainer>
      <section className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d73cbe]/30 bg-[#d73cbe]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#d73cbe]">
          <ShieldCheck className="h-3.5 w-3.5" />
          ADMIN
        </div>
        <h1 className="text-3xl font-bold text-white">
          Painel administrativo
        </h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Visao geral da operacao MWC para suporte, mediacao e financeiro.
          Papel atual: {admin.adminRole}.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-white/10 bg-slate-900/70 p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {card.value}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 text-[#d73cbe]">
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">{card.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {shortcuts.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-lg border border-white/10 bg-slate-900/70 p-5 transition-colors hover:border-[#d73cbe]/40 hover:bg-slate-900"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-[#d73cbe]">
                <item.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-[#d73cbe]" />
            </div>
            <h2 className="text-lg font-bold text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {item.description}
            </p>
          </Link>
        ))}
      </section>
    </PageContainer>
  );
}
