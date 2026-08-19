"use client";

import {
  decideProfessionalVerification,
  retryProfessionalVerificationDecisionEmail,
  startProfessionalVerificationReview,
} from "@/modules/admin/actions/professional-verification-actions";
import { LoaderCircle, MailWarning } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function AdminVerificationActions({
  verificationId,
  status,
  isTeacher,
  sourceUrl,
  decisionNotifiedAt,
  decisionEmailError,
}: {
  verificationId: string;
  status: string;
  isTeacher: boolean;
  sourceUrl: string | null;
  decisionNotifiedAt: string | null;
  decisionEmailError: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [decision, setDecision] = useState("APPROVE");

  function beginReview() {
    startTransition(async () => {
      const result = await startProfessionalVerificationReview(verificationId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Analise iniciada.");
        router.refresh();
      }
    });
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await decideProfessionalVerification(formData);
      if (result.error) toast.error(result.error);
      else {
        if (result.emailDelivered) toast.success("Decisao registrada e comunicada.");
        else toast.warning("Decisao registrada, mas o e-mail ficou pendente.");
        router.refresh();
      }
    });
  }

  function retryEmail() {
    startTransition(async () => {
      const result =
        await retryProfessionalVerificationDecisionEmail(verificationId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("E-mail reenviado.");
        router.refresh();
      }
    });
  }

  const canDecide = ["PENDING", "UNDER_REVIEW"].includes(status);
  const canSuspend = status === "APPROVED";
  const hasDecision = [
    "APPROVED",
    "CHANGES_REQUIRED",
    "REJECTED",
    "SUSPENDED",
  ].includes(status);
  if (!canDecide && !canSuspend && !hasDecision) return null;

  return (
    <section className="rounded-lg border border-[#d73cbe]/20 bg-slate-900/80 p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Decisao administrativa</h2>
          <p className="mt-1 text-sm text-slate-400">A decisao e registrada na auditoria e comunicada ao profissional.</p>
        </div>
        {status === "PENDING" && (
          <button onClick={beginReview} disabled={isPending} className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-50">
            Iniciar analise
          </button>
        )}
      </div>

      {hasDecision && (
        <div className={`mt-5 rounded-lg border p-4 text-sm ${
          decisionNotifiedAt
            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200"
            : "border-amber-500/20 bg-amber-500/5 text-amber-100"
        }`}>
          {decisionNotifiedAt ? (
            <p>O profissional foi comunicado por e-mail.</p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <MailWarning className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-bold">Comunicacao por e-mail pendente</p>
                  <p className="mt-1 text-xs text-amber-200/70">
                    {decisionEmailError || "O provedor nao confirmou a entrega."}
                  </p>
                </div>
              </div>
              <button type="button" onClick={retryEmail} disabled={isPending} className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">
                Reenviar e-mail
              </button>
            </div>
          )}
        </div>
      )}

      {(canDecide || canSuspend) && <form action={submit} className="mt-5 grid gap-4">
        <input type="hidden" name="verificationId" value={verificationId} />
        {canSuspend && <input type="hidden" name="decision" value="SUSPEND" />}
        <label className="space-y-1.5">
          <span className="text-xs font-bold uppercase text-slate-500">Decisao</span>
          <select name={canSuspend ? undefined : "decision"} value={canSuspend ? "SUSPEND" : decision} onChange={(event) => setDecision(event.target.value)} disabled={canSuspend} className="h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-[#d73cbe]">
            {canSuspend ? <option value="SUSPEND">Suspender verificacao</option> : <>
              <option value="APPROVE">Aprovar</option>
              <option value="CHANGES_REQUIRED">Solicitar ajustes</option>
              <option value="REJECT">Recusar</option>
            </>}
          </select>
        </label>

        {(decision === "APPROVE" && !canSuspend) && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-slate-500">Resultado da consulta</span>
              <select name="officialCheckResult" defaultValue={isTeacher ? "NOT_APPLICABLE" : "ACTIVE"} className="h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-[#d73cbe]">
                {isTeacher ? <option value="NOT_APPLICABLE">Nao se aplica</option> : <>
                  <option value="ACTIVE">Registro ativo</option>
                  <option value="INACTIVE">Registro inativo</option>
                  <option value="NOT_FOUND">Nao encontrado</option>
                  <option value="INCONCLUSIVE">Consulta inconclusiva</option>
                </>}
              </select>
            </label>
            {!isTeacher && (
              <label className="space-y-1.5">
                <span className="text-xs font-bold uppercase text-slate-500">Fonte oficial consultada</span>
                <input name="officialSourceUrl" type="url" required defaultValue={sourceUrl || ""} className="h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-[#d73cbe]" />
              </label>
            )}
          </div>
        )}

        <label className="space-y-1.5">
          <span className="text-xs font-bold uppercase text-slate-500">Justificativa / observacoes</span>
          <textarea name="reason" required={canSuspend || decision !== "APPROVE"} rows={4} placeholder="Obrigatoria para ajustes, recusa ou suspensao." className="w-full rounded-lg border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none focus:border-[#d73cbe]" />
        </label>

        <button type="submit" disabled={isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#d73cbe] px-5 py-3 text-sm font-bold text-white hover:bg-[#b02da0] disabled:opacity-50 sm:w-auto">
          {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />} Registrar decisao
        </button>
      </form>}
    </section>
  );
}
