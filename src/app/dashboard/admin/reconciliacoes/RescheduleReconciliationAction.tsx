"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { retryRescheduleReconciliation } from "@/modules/health/actions/admin-reschedule-reconciliation-actions";

export function RescheduleReconciliationAction({
  processId,
}: {
  processId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await retryRescheduleReconciliation(processId);
          if (result.success) {
            toast.success("Reagendamento retomado.");
          } else {
            toast.error(
              result.error || "Nao foi possivel retomar o reagendamento.",
            );
          }
        })
      }
      className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#d73cbe] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#c42cab] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
      Tentar novamente
    </button>
  );
}
