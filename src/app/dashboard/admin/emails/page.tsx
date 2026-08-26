import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Mail,
  Search,
  ServerCog,
} from "lucide-react";

import { EmailOutboxStatus } from "@prisma/client";
import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import {
  EMAIL_OUTBOX_STATUS_FILTERS,
  getAdminEmailOutboxDashboard,
} from "@/modules/admin/services/admin-email-outbox-service";
import { queueEmailSmokeTestAdmin } from "@/modules/admin/actions/queue-email-smoke-test";
import { AdminPageHeader } from "@/modules/admin/components/AdminPageHeader";
import { AdminMetricCard } from "@/modules/admin/components/AdminMetricCard";

const statusLabels: Record<string, string> = {
  ALL: "Todos",
  PENDING: "Pendente",
  PROCESSING: "Processando",
  SENT: "Aceito",
  DELIVERED: "Entregue",
  FAILED: "Nova tentativa",
  REQUIRES_ATTENTION: "Exige atenção",
  CANCELED: "Cancelado",
};

const statusClasses: Record<EmailOutboxStatus, string> = {
  PENDING: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  PROCESSING: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  SENT: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  DELIVERED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  FAILED: "border-orange-400/20 bg-orange-400/10 text-orange-300",
  REQUIRES_ATTENTION: "border-red-400/20 bg-red-400/10 text-red-300",
  CANCELED: "border-slate-400/20 bg-slate-400/10 text-slate-400",
};

function emailListUrl({
  page,
  status,
  search,
}: {
  page?: number;
  status?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (page && page > 1) params.set("page", String(page));
  if (status && status !== "ALL") params.set("status", status);
  if (search) params.set("search", search);
  const query = params.toString();
  return `/dashboard/admin/emails${query ? `?${query}` : ""}`;
}

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
    result?: string;
  }>;
}) {
  const params = await searchParams;
  const dashboard = await getAdminEmailOutboxDashboard(params);
  const configurationProblems = dashboard.configuration.filter(
    (item) => !item.configured,
  );

  return (
    <PageContainer>
      <div className="space-y-8">
        <AdminPageHeader
          eyebrow="Operação de e-mail"
          title="Caixa de saída transacional"
          description="Acompanhe o processamento, a aceitação pelo Resend e a entrega ao servidor do destinatário. Falhas permanentes ficam protegidas para análise administrativa."
          icon={Mail}
          actions={dashboard.canRunSmokeTest ? (
            <form action={queueEmailSmokeTestAdmin}>
              <button className="rounded-lg border border-[#d73cbe]/30 bg-[#d73cbe]/10 px-4 py-2.5 text-xs font-semibold text-[#ef9ee2] transition-colors hover:bg-[#d73cbe]/20">
                Enviar teste para meu e-mail
              </button>
            </form>
          ) : undefined}
        />

        {params.result === "smoke-rate-limited" && (
          <section className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Limite de testes operacionais atingido. Aguarde antes de solicitar outro envio.
          </section>
        )}

        {configurationProblems.length > 0 && (
          <section className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div>
                <h2 className="font-bold text-amber-100">Configuração exige verificação</h2>
                <p className="mt-1 text-sm text-amber-100/70">
                  {configurationProblems.map((item) => item.label).join(", ")}.
                  Nenhum segredo é exibido neste painel.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          <AdminMetricCard
            icon={Clock3}
            label="Aguardando processamento"
            value={
              dashboard.statusCounts.PENDING +
              dashboard.statusCounts.PROCESSING +
              dashboard.statusCounts.FAILED
            }
            detail="Fila e backoff automático"
            tone="warning"
          />
          <AdminMetricCard
            icon={CheckCircle2}
            label="Entregues em 30 dias"
            value={dashboard.recent.delivered}
            detail={`${dashboard.recent.deliveryRate}% dos eventos com resultado final`}
            tone="success"
          />
          <AdminMetricCard
            icon={AlertTriangle}
            label="Exigem atenção"
            value={dashboard.statusCounts.REQUIRES_ATTENTION}
            detail={`${dashboard.recent.attention} criados nos últimos 30 dias`}
            tone="danger"
          />
          <AdminMetricCard
            icon={ServerCog}
            label="Webhook Resend"
            value={dashboard.latestWebhook?.status === "FAILED" ? "Falha" : dashboard.latestWebhook ? "Recebendo" : "Sem eventos"}
            detail={
              dashboard.latestWebhook
                ? `${dashboard.latestWebhook.eventType} · ${dashboard.latestWebhook.createdAt.toLocaleString("pt-BR")}`
                : "Aguardando o primeiro evento autenticado"
            }
            tone={dashboard.latestWebhook?.status === "FAILED" ? "danger" : "success"}
          />
          <AdminMetricCard
            icon={Clock3}
            label="Processador agendado"
            value={dashboard.cronHeartbeat?.status === "SUCCESS" ? "Ativo" : dashboard.cronHeartbeat?.status === "FAILED" ? "Falha" : "Sem execução"}
            detail={
              dashboard.cronHeartbeat?.lastSucceededAt
                ? `Último sucesso: ${dashboard.cronHeartbeat.lastSucceededAt.toLocaleString("pt-BR")}`
                : "Aguardando a primeira execução autenticada"
            }
            tone={dashboard.cronHeartbeat?.status === "FAILED" ? "danger" : "brand"}
          />
        </section>

        <section className="rounded-xl border border-white/[0.08] bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-white">Integridade da configuração</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.configuration.map((item) => (
              <div
                key={item.key}
                className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-black/15 px-3.5 py-3"
              >
                <span className="min-w-0 text-xs leading-5 text-slate-300">{item.label}</span>
                <span
                  className={`text-xs font-bold uppercase ${item.configured ? "text-emerald-300" : "text-amber-300"}`}
                >
                  {item.configured ? "OK" : "Verificar"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-slate-900/70">
          <div className="border-b border-white/10 p-5">
            <form className="flex flex-col gap-3 md:flex-row">
              <label className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  name="search"
                  defaultValue={dashboard.filters.search}
                  placeholder="Destinatário, evento, entidade ou ID do provedor"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#d73cbe]/50"
                />
              </label>
              {dashboard.filters.status !== "ALL" && (
                <input type="hidden" name="status" value={dashboard.filters.status} />
              )}
              <button className="rounded-xl bg-[#d73cbe] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#bd31a7]">
                Buscar
              </button>
            </form>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {EMAIL_OUTBOX_STATUS_FILTERS.map((status) => (
                <Link
                  key={status}
                  href={emailListUrl({ status, search: dashboard.filters.search })}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${
                    dashboard.filters.status === status
                      ? "border-[#d73cbe]/50 bg-[#d73cbe]/15 text-[#ef9ee2]"
                      : "border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {statusLabels[status]}
                  {status !== "ALL" ? ` (${dashboard.statusCounts[status]})` : ""}
                </Link>
              ))}
            </div>
          </div>

          {dashboard.emails.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              Nenhum e-mail encontrado para os filtros informados.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {dashboard.emails.map((email) => (
                <Link
                  key={email.id}
                  href={`/dashboard/admin/emails/${email.id}`}
                  className="grid gap-3 p-5 transition-colors hover:bg-white/[0.03] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{email.eventType}</p>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {email.recipientEmail}
                    </p>
                    {email.lastErrorMessage && (
                      <p className="mt-1 truncate text-xs text-red-300/80">
                        {email.lastErrorCode}: {email.lastErrorMessage}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    <p>{email.createdAt.toLocaleString("pt-BR")}</p>
                    <p className="mt-1">
                      Tentativas: {email.attemptCount}/{email.maxAttempts}
                      {email.retry ? " · nova tentativa criada" : ""}
                    </p>
                  </div>
                  <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses[email.status]}`}>
                    {statusLabels[email.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {dashboard.pagination.totalPages > 1 && (
            <nav className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-sm">
              <Link
                href={emailListUrl({
                  page: Math.max(1, dashboard.pagination.page - 1),
                  status: dashboard.filters.status,
                  search: dashboard.filters.search,
                })}
                aria-disabled={dashboard.pagination.page === 1}
                className={dashboard.pagination.page === 1 ? "pointer-events-none text-slate-700" : "text-slate-300 hover:text-white"}
              >
                Anterior
              </Link>
              <span className="text-slate-500">
                Página {dashboard.pagination.page} de {dashboard.pagination.totalPages}
              </span>
              <Link
                href={emailListUrl({
                  page: Math.min(dashboard.pagination.totalPages, dashboard.pagination.page + 1),
                  status: dashboard.filters.status,
                  search: dashboard.filters.search,
                })}
                aria-disabled={dashboard.pagination.page === dashboard.pagination.totalPages}
                className={dashboard.pagination.page === dashboard.pagination.totalPages ? "pointer-events-none text-slate-700" : "text-slate-300 hover:text-white"}
              >
                Próxima
              </Link>
            </nav>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-slate-900/70">
          <div className="border-b border-white/10 p-5">
            <h2 className="font-bold text-white">Métricas por tipo · últimos 30 dias</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Evento</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Entregues</th><th className="px-5 py-3">Pendentes</th><th className="px-5 py-3">Atenção</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dashboard.eventMetrics.map((metric) => (
                  <tr key={metric.eventType}>
                    <td className="max-w-xs px-5 py-3 font-medium text-white [overflow-wrap:anywhere]">{metric.eventType}</td>
                    <td className="px-5 py-3 text-slate-400">{metric.total}</td>
                    <td className="px-5 py-3 text-emerald-300">{metric.delivered}</td>
                    <td className="px-5 py-3 text-amber-300">{metric.pending}</td>
                    <td className="px-5 py-3 text-red-300">{metric.attention}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
