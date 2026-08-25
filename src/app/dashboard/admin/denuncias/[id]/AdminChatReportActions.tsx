"use client";

import { useState } from "react";
import { Ban, CheckCircle2, Loader2, MailWarning, PauseCircle, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  resolveChatReport,
  retryChatReportDecisionEmails,
  startChatReportReview,
} from "@/modules/admin/actions/chat-report-actions";

type Decision = "WARNING" | "NO_PENALTY";

export default function AdminChatReportActions({
  reportId,
  status,
  decisionNotifiedAt,
  decisionEmailError,
}: {
  reportId: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
  decisionNotifiedAt: string | null;
  decisionEmailError: string | null;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isClosed = status === "RESOLVED" || status === "DISMISSED";

  async function handleStartReview() {
    setIsSubmitting(true);
    const result = await startChatReportReview(reportId);
    setIsSubmitting(false);
    if (!result.success) {
      toast.error(result.error || "Nao foi possivel iniciar a analise.");
      return;
    }
    toast.success("Analise iniciada.");
    router.refresh();
  }

  async function handleResolve(event: React.FormEvent) {
    event.preventDefault();
    if (!decision) return;
    setIsSubmitting(true);
    const result = await resolveChatReport({ reportId, decision, reason });
    setIsSubmitting(false);
    if (!result.success) {
      toast.error(result.error || "Nao foi possivel concluir a analise.");
      return;
    }
    toast.success(
      result.data?.emailQueued
        ? decision === "WARNING"
          ? "Advertencia emitida e comunicacoes registradas."
          : "Denuncia encerrada e comunicacoes registradas."
        : "Decisao administrativa salva.",
    );
    setDecision(null);
    setReason("");
    router.refresh();
  }

  async function handleRetryEmails() {
    setIsSubmitting(true);
    const result = await retryChatReportDecisionEmails(reportId);
    setIsSubmitting(false);
    if (!result.success) {
      toast.error(result.error || "Nao foi possivel reenviar os e-mails.");
      return;
    }
    toast.success(
      result.data?.emailQueued
        ? "Reenvio dos e-mails registrado."
        : "Solicitacao processada.",
    );
    router.refresh();
  }

  return (
    <div className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
      <div>
        <h2 className="font-bold text-white">Decisao administrativa</h2>
        <p className="mt-1 text-sm text-slate-400">
          A justificativa fica no historico e a conclusao e enviada por e-mail
          aos envolvidos.
        </p>
      </div>

      {!isClosed && status === "OPEN" && (
        <button
          type="button"
          onClick={handleStartReview}
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-2.5 text-sm font-bold text-blue-200 hover:bg-blue-500/15 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PauseCircle className="h-4 w-4" />
          )}
          Iniciar analise
        </button>
      )}

      {!isClosed && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setDecision("WARNING")}
            className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-200 hover:bg-amber-500/15"
          >
            <ShieldAlert className="h-4 w-4" />
            Emitir advertencia
          </button>
          <button
            type="button"
            onClick={() => setDecision("NO_PENALTY")}
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200 hover:bg-emerald-500/15"
          >
            <CheckCircle2 className="h-4 w-4" />
            Encerrar sem penalidade
          </button>
        </div>
      )}

      {isClosed && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            decisionNotifiedAt
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200"
              : "border-amber-500/20 bg-amber-500/5 text-amber-100"
          }`}
        >
          {decisionNotifiedAt ? (
            <p>Os envolvidos foram notificados por e-mail.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <MailWarning className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-bold">Envio de e-mail pendente</p>
                  <p className="mt-1 text-xs text-amber-200/70">
                    {decisionEmailError || "O provedor nao confirmou a entrega."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRetryEmails}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Reenviar e-mails
              </button>
            </div>
          )}
        </div>
      )}

      {decision && !isClosed && (
        <form onSubmit={handleResolve} className="space-y-3 rounded-xl border border-white/10 bg-slate-950/60 p-4">
          <label className="block text-sm font-bold text-slate-200">
            Justificativa obrigatoria
          </label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            minLength={10}
            maxLength={2000}
            required
            rows={5}
            placeholder="Registre os fatos considerados e a fundamentacao da decisao."
            className="w-full resize-none rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none focus:border-[#d73cbe]"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDecision(null)}
              disabled={isSubmitting}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || reason.trim().length < 10}
              className="flex items-center gap-2 rounded-xl bg-[#d73cbe] px-4 py-2 text-sm font-bold text-white hover:bg-[#bd2fa6] disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar decisao
            </button>
          </div>
        </form>
      )}

      <div className="border-t border-white/10 pt-5">
        <h3 className="text-sm font-bold text-white">Medidas sobre a conta</h3>
        <p className="mt-1 text-xs text-slate-500">
          Estas medidas exigem uma politica de moderacao de contas e ainda nao
          estao integradas a este caso.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {["Bloquear conta", "Suspender conta", "Desativar conta"].map(
            (label) => (
              <button
                key={label}
                type="button"
                disabled
                title="Implementacao pendente"
                className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-600"
              >
                <Ban className="h-3.5 w-3.5" />
                {label}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
