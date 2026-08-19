import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Briefcase, Flag, ShieldCheck, User } from "lucide-react";

import { requireAdminUser } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { getAdminAuditLogs } from "@/modules/admin/actions/audit-log";
import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import AdminChatReportActions from "./AdminChatReportActions";

const reasonLabels = {
  HARASSMENT: "Assedio ou comportamento abusivo",
  FRAUD: "Fraude ou tentativa de golpe",
  SPAM: "Spam ou mensagens repetitivas",
  EXTERNAL_PAYMENT: "Solicitacao de pagamento externo",
  INAPPROPRIATE_CONTENT: "Conteudo inapropriado",
  THREAT: "Ameaca ou risco a seguranca",
  OTHER: "Outro motivo",
} as const;

const statusLabels = {
  OPEN: "Aberta",
  UNDER_REVIEW: "Em analise",
  RESOLVED: "Resolvida com advertencia",
  DISMISSED: "Encerrada sem penalidade",
} as const;

type Snapshot = {
  projects?: Array<{
    id: string;
    title: string;
    status: string;
    agreedPrice: string | null;
    updatedAt: string;
  }>;
};

export default async function AdminChatReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminUser();
  const { id } = await params;
  const reportHeader = await db.chatReport.findUnique({
    where: { id },
    select: { reportedThroughAt: true },
  });

  if (!reportHeader) notFound();

  const [report, auditLogs] = await Promise.all([
    db.chatReport.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, name: true, displayName: true, email: true, userType: true, industry: true, isActive: true },
        },
        reportedUser: {
          select: { id: true, name: true, displayName: true, email: true, userType: true, industry: true, isActive: true },
        },
        reviewer: { select: { name: true, email: true } },
        conversation: {
          include: {
            messages: {
              where: { createdAt: { lte: reportHeader.reportedThroughAt } },
              orderBy: { createdAt: "asc" },
              include: { sender: { select: { id: true, name: true, displayName: true } } },
            },
          },
        },
        createdBlock: { select: { id: true, createdAt: true } },
      },
    }),
    getAdminAuditLogs({ entityType: "CHAT_REPORT", entityId: id }),
  ]);

  if (!report) notFound();

  const snapshot = report.contextSnapshot as Snapshot;

  return (
    <PageContainer>
      <div className="space-y-6">
        <Link href="/dashboard/admin/denuncias" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar para denuncias
        </Link>

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold uppercase text-red-300">
                  <Flag className="h-3.5 w-3.5" /> {reasonLabels[report.reason]}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                  {statusLabels[report.status]}
                </span>
                {report.isPriority && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5" /> Prioridade financeira
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-2xl font-bold text-white">Caso {report.id.slice(0, 8).toUpperCase()}</h1>
              <p className="mt-2 text-xs text-slate-500">Registrada em {report.createdAt.toLocaleString("pt-BR")} · Evidencias ate {report.reportedThroughAt.toLocaleString("pt-BR")}</p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-emerald-300">
              <ShieldCheck className="h-4 w-4" /> Conversa preservada · bloqueio ativo
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Relato</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{report.description}</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <PartyCard title="Denunciante" party={report.reporter} />
          <PartyCard title="Denunciado" party={report.reportedUser} />
        </section>

        {(snapshot.projects?.length || 0) > 0 && (
          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <h2 className="flex items-center gap-2 font-bold text-white"><Briefcase className="h-4 w-4 text-[#d73cbe]" /> Projetos relacionados no momento da denuncia</h2>
            <div className="mt-4 divide-y divide-white/5">
              {snapshot.projects!.map((project) => (
                <div key={project.id} className="flex flex-col gap-1 py-3 text-sm md:flex-row md:items-center md:justify-between">
                  <div><p className="font-semibold text-slate-200">{project.title}</p><p className="text-xs text-slate-500">{project.id}</p></div>
                  <span className="text-xs font-bold text-slate-400">{project.status}{project.agreedPrice ? ` · R$ ${project.agreedPrice}` : ""}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="font-bold text-white">Historico completo da conversa</h2>
          <p className="mt-1 text-xs text-slate-500">Mensagens posteriores ao envio da denuncia nao fazem parte da evidencia.</p>
          <div className="mt-5 max-h-[650px] space-y-3 overflow-y-auto rounded-xl border border-white/5 bg-slate-950/70 p-4">
            {report.conversation.messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Nenhuma mensagem registrada.</p>
            ) : report.conversation.messages.map((message) => (
              <div key={message.id} className="rounded-xl border border-white/5 bg-slate-900 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-300">{message.sender.displayName || message.sender.name} {message.senderId === report.reporterId ? "(denunciante)" : "(denunciado)"}</span>
                  <span className="text-slate-600">{message.createdAt.toLocaleString("pt-BR")}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-200">{message.content}</p>
              </div>
            ))}
          </div>
        </section>

        {report.resolutionReason && (
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <h2 className="font-bold text-emerald-200">Conclusao administrativa</h2>
            <p className="mt-2 text-sm leading-6 text-slate-200">{report.resolutionReason}</p>
            <p className="mt-3 text-xs text-slate-500">Responsavel: {report.reviewer?.name || report.reviewer?.email || "Admin"} · {report.resolvedAt?.toLocaleString("pt-BR")}</p>
          </section>
        )}

        <AdminChatReportActions
          reportId={report.id}
          status={report.status}
          decisionNotifiedAt={report.decisionNotifiedAt?.toISOString() ?? null}
          decisionEmailError={report.decisionEmailError}
        />

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="font-bold text-white">Auditoria administrativa</h2>
          <div className="mt-4 space-y-3">
            {auditLogs.length === 0 ? <p className="text-sm text-slate-500">Nenhuma acao administrativa registrada.</p> : auditLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-white/5 bg-slate-950/60 p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2"><span className="font-bold text-slate-200">{log.action}</span><span className="text-xs text-slate-500">{log.createdAt.toLocaleString("pt-BR")}</span></div>
                <p className="mt-1 text-slate-400">{log.reason}</p>
                <p className="mt-2 text-xs text-slate-600">{log.actor.name || log.actor.email}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

function PartyCard({ title, party }: { title: string; party: { id: string; name: string; displayName: string | null; email: string; userType: string; industry: string; isActive: boolean } }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500"><User className="h-4 w-4" /> {title}</h2>
      <p className="mt-4 font-bold text-white">{party.displayName || party.name}</p>
      <p className="mt-1 text-sm text-slate-400">{party.email}</p>
      <p className="mt-3 text-xs text-slate-500">{party.userType} · {party.industry} · {party.isActive ? "Conta ativa" : "Conta inativa"}</p>
      <p className="mt-1 break-all text-[10px] text-slate-600">{party.id}</p>
    </div>
  );
}
