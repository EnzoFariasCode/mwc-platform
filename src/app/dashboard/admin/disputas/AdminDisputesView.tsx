"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
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
  openedAt: string | null;
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
  if (amount === null) return "Valor nao informado";

  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value: string | null) {
  if (!value) return "Data nao informada";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
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

  const healthCount = disputes.filter((item) => item.kind === "HEALTH").length;
  const techCount = disputes.filter((item) => item.kind === "TECH").length;

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
            Mediação de Disputas
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Decida reembolsos e liberações financeiras dos setores Tech e Saúde.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Metric label="Total" value={disputes.length} />
          <Metric label="Tech" value={techCount} />
          <Metric label="Saúde" value={healthCount} />
        </div>
      </div>

      {disputes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-12 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Sem disputas abertas</h2>
          <p className="mt-2 text-sm text-slate-400">
            Quando houver mediação pendente, ela aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {disputes.map((dispute) => (
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
                      {dispute.kind === "TECH" ? "Tech" : "Saúde"}
                    </span>
                    <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-300">
                      {dispute.status}
                    </span>
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

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <span>Aberta: {formatDate(dispute.openedAt)}</span>
                <span>Atualizada: {formatDate(dispute.updatedAt)}</span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            ? "Registre o motivo da decisão antes de solicitar o reembolso."
            : "Registre o motivo da decisão antes de liberar o valor ao profissional."
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
