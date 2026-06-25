"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrencyBR, formatDateTimeBR } from "@/lib/formatters";
import { TechProjectReasonModal } from "@/modules/projects/components/TechProjectReasonModal";
import { resolveHealthAppointmentDispute } from "@/modules/health/actions/appointment-actions";
import { resolveTechProjectDispute } from "@/modules/projects/actions/project-state-actions";

export type AdminDisputeItem = {
  id: string;
  kind: "TECH" | "HEALTH";
  title: string;
  status: string;
  amount: number | null;
  reason: string | null;
  resolutionReason: string | null;
  resolution: "REFUND" | "RELEASE" | null;
  isOpen: boolean;
  openedAt: string | null;
  resolvedAt: string | null;
  updatedAt: string;
  requesterLabel: "Cliente" | "Paciente";
  requesterName: string;
  requesterEmail: string | null;
  professionalName: string;
  professionalEmail: string | null;
};

type PendingDecision = {
  dispute: AdminDisputeItem;
  decision: "REFUND" | "RELEASE";
};

function formatMoney(amount: number | null) {
  return formatCurrencyBR(amount, "Valor nao informado");
}

function formatDate(value: string | null) {
  return formatDateTimeBR(value, "Data nao informada");
}

function isWithinDateRange(value: string, dateFrom: string, dateTo: string) {
  const date = new Date(value);

  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00`);
    if (date < from) return false;
  }

  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59`);
    if (date > to) return false;
  }

  return true;
}

export default function AdminDisputesView({
  disputes,
}: {
  disputes: AdminDisputeItem[];
}) {
  const router = useRouter();
  const [pendingDecision, setPendingDecision] =
    useState<PendingDecision | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [filter, setFilter] = useState<"OPEN" | "RESOLVED" | "ALL">("OPEN");
  const [searchTerm, setSearchTerm] = useState("");
  const [kindFilter, setKindFilter] = useState<"ALL" | "TECH" | "HEALTH">(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const searchedDisputes = disputes.filter((item) => {
    const haystack = [
      item.id,
      item.kind,
      item.status,
      item.title,
      item.reason,
      item.resolutionReason,
      item.requesterName,
      item.requesterEmail,
      item.professionalName,
      item.professionalEmail,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      (!normalizedSearch || haystack.includes(normalizedSearch)) &&
      (kindFilter === "ALL" || item.kind === kindFilter) &&
      (statusFilter === "ALL" || item.status === statusFilter) &&
      isWithinDateRange(item.updatedAt, dateFrom, dateTo)
    );
  });
  const openDisputes = searchedDisputes.filter((item) => item.isOpen);
  const resolvedDisputes = searchedDisputes.filter((item) => !item.isOpen);
  const filteredDisputes =
    filter === "OPEN"
      ? openDisputes
      : filter === "RESOLVED"
        ? resolvedDisputes
        : searchedDisputes;
  const healthCount = openDisputes.filter((item) => item.kind === "HEALTH").length;
  const techCount = openDisputes.filter((item) => item.kind === "TECH").length;
  const statuses = Array.from(new Set(disputes.map((item) => item.status)));

  async function handleResolve(reason: string) {
    if (!pendingDecision) return;

    setIsResolving(true);

    const { dispute, decision } = pendingDecision;
    const result =
      dispute.kind === "HEALTH"
        ? await resolveHealthAppointmentDispute({
            appointmentId: dispute.id,
            decision:
              decision === "REFUND"
                ? "REFUND_PATIENT"
                : "RELEASE_TO_PROFESSIONAL",
            reason,
          })
        : await resolveTechProjectDispute({
            projectId: dispute.id,
            decision:
              decision === "REFUND"
                ? "REFUND_CLIENT"
                : "RELEASE_TO_PROFESSIONAL",
            reason,
          });

    if ("success" in result && result.success) {
      toast.success("Disputa resolvida.");
      setPendingDecision(null);
      router.refresh();
    } else {
      toast.error(result.error || "Nao foi possivel resolver a disputa.");
    }

    setIsResolving(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </div>
          <h1 className="text-2xl font-bold text-white font-futura">
            Mediacao de Disputas
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Decida reembolsos e liberacoes financeiras, e consulte o historico
            dos setores Tech e Saude.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric label="Abertas" value={openDisputes.length} />
          <Metric label="Tech" value={techCount} />
          <Metric label="Saude" value={healthCount} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900 p-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_0.7fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por ID real, email, nome, motivo..."
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-red-300"
            />
          </label>
          <select
            value={kindFilter}
            onChange={(event) =>
              setKindFilter(event.target.value as "ALL" | "TECH" | "HEALTH")
            }
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-red-300"
          >
            <option value="ALL">Todos setores</option>
            <option value="TECH">Tech</option>
            <option value="HEALTH">Saude</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-red-300"
          >
            <option value="ALL">Todos status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-red-300"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-red-300"
          />
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setKindFilter("ALL");
              setStatusFilter("ALL");
              setDateFrom("");
              setDateTo("");
            }}
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-4 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-800"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: "OPEN" as const, label: "Abertas", count: openDisputes.length },
          {
            value: "RESOLVED" as const,
            label: "Historico",
            count: resolvedDisputes.length,
          },
          { value: "ALL" as const, label: "Todas", count: searchedDisputes.length },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
              filter === item.value
                ? "border-red-300 bg-red-300 text-slate-950"
                : "border-white/10 bg-slate-900 text-slate-300 hover:border-white/20 hover:bg-slate-800"
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {filteredDisputes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-12 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">
            Nenhuma disputa neste filtro
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Alterne entre abertas e historico para consultar outros registros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {filteredDisputes.map((dispute) => (
            <article
              key={`${dispute.kind}-${dispute.id}`}
              className="rounded-2xl border border-white/5 bg-slate-900 p-6 shadow-lg shadow-black/10"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        dispute.kind === "TECH"
                          ? "bg-[#d73cbe]/10 text-[#d73cbe]"
                          : "bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {dispute.kind === "TECH" ? "Tech" : "Saude"}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        dispute.isOpen
                          ? "bg-red-500/10 text-red-300"
                          : "bg-slate-500/10 text-slate-300"
                      }`}
                    >
                      {dispute.isOpen ? dispute.status : "RESOLVIDA"}
                    </span>
                    {dispute.resolution && (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                        {dispute.resolution === "REFUND"
                          ? "Reembolso"
                          : "Liberado"}
                      </span>
                    )}
                  </div>
                  <h2 className="line-clamp-2 text-lg font-bold text-white">
                    {dispute.title}
                  </h2>
                </div>
                <div className="shrink-0 rounded-xl border border-white/5 bg-slate-950 px-3 py-2 text-right">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Valor
                  </p>
                  <p className="text-sm font-bold text-white">
                    {formatMoney(dispute.amount)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 border-y border-white/5 py-4 text-sm md:grid-cols-2">
                <PersonBlock
                  label={dispute.requesterLabel}
                  name={dispute.requesterName}
                  email={dispute.requesterEmail}
                />
                <PersonBlock
                  label="Profissional"
                  name={dispute.professionalName}
                  email={dispute.professionalEmail}
                />
              </div>

              <div className="mt-4 rounded-xl border border-white/5 bg-slate-950/70 p-4">
                <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Motivo
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                  {dispute.reason || "Motivo nao informado."}
                </p>
              </div>

              {dispute.resolutionReason && (
                <div className="mt-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                  <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Decisao
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                    {dispute.resolutionReason}
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <span>Aberta: {formatDate(dispute.openedAt)}</span>
                {dispute.resolvedAt && (
                  <span>Resolvida: {formatDate(dispute.resolvedAt)}</span>
                )}
                <span>Atualizada: {formatDate(dispute.updatedAt)}</span>
              </div>

              {dispute.isOpen ? (
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Link
                    href={`/dashboard/admin/disputas/${dispute.kind.toLowerCase()}/${dispute.id}`}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-xs font-bold text-slate-200 transition-colors hover:border-white/20 hover:bg-slate-800"
                  >
                    Ver detalhes
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingDecision({ dispute, decision: "REFUND" })
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-300 transition-colors hover:bg-red-500 hover:text-white"
                  >
                    <CreditCard className="h-4 w-4" />
                    Reembolsar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingDecision({ dispute, decision: "RELEASE" })
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500 hover:text-black"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Liberar ao profissional
                  </button>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-xs font-bold text-slate-400">
                    Registro historico sem acao pendente.
                  </div>
                  <Link
                    href={`/dashboard/admin/disputas/${dispute.kind.toLowerCase()}/${dispute.id}`}
                    className="flex items-center justify-center rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-xs font-bold text-slate-200 transition-colors hover:border-white/20 hover:bg-slate-800"
                  >
                    Ver detalhes
                  </Link>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <TechProjectReasonModal
        key={
          pendingDecision
            ? `${pendingDecision.dispute.kind}-${pendingDecision.dispute.id}-${pendingDecision.decision}`
            : "closed"
        }
        isOpen={!!pendingDecision}
        onClose={() => {
          if (!isResolving) setPendingDecision(null);
        }}
        onConfirm={handleResolve}
        isLoading={isResolving}
        title={
          pendingDecision?.decision === "REFUND"
            ? "Aprovar reembolso"
            : "Liberar pagamento"
        }
        description={
          pendingDecision?.decision === "REFUND"
            ? "Registre o motivo da decisao antes de solicitar o reembolso."
            : "Registre o motivo da decisao antes de liberar o valor ao profissional."
        }
        confirmLabel={
          pendingDecision?.decision === "REFUND"
            ? "Confirmar reembolso"
            : "Liberar pagamento"
        }
        minLength={10}
        tone={pendingDecision?.decision === "REFUND" ? "danger" : "warning"}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-900 px-4 py-3 text-right">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function PersonBlock({
  label,
  name,
  email,
}: {
  label: string;
  name: string;
  email: string | null;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="truncate font-bold text-white">{name}</p>
      <p className="truncate text-xs text-slate-400">{email || "Sem email"}</p>
    </div>
  );
}
