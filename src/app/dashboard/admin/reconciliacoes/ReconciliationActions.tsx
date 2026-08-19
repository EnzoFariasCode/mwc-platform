"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  confirmMeetCancellationManually,
  registerCancellationRefund,
  retryCancellationReconciliation,
} from "@/modules/health/actions/admin-cancellation-reconciliation-actions";

export function ReconciliationActions({
  processId,
  meetPending,
  refundPending,
  canAttachRefund,
}: {
  processId: string;
  meetPending: boolean;
  refundPending: boolean;
  canAttachRefund: boolean;
}) {
  const [refundId, setRefundId] = useState("");
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success("Reconciliação retomada.");
      } else {
        toast.error(result.error || "Não foi possível retomar o processo.");
      }
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => retryCancellationReconciliation(processId))}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#d73cbe] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#c42cab] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          Tentar novamente
        </button>

        {meetPending && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(() => confirmMeetCancellationManually(processId))
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Meet resolvido
          </button>
        )}
      </div>

      {refundPending && canAttachRefund && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={refundId}
            onChange={(event) => setRefundId(event.target.value)}
            placeholder="ID do reembolso Stripe (re_...)"
            className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]/60"
          />
          <button
            type="button"
            disabled={isPending || !refundId.trim()}
            onClick={() =>
              run(() => registerCancellationRefund(processId, refundId))
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Validar reembolso
          </button>
        </div>
      )}
    </div>
  );
}
