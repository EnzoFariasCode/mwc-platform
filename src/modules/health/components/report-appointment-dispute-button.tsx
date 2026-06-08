"use client";

import { useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { reportHealthAppointmentDispute } from "@/modules/health/actions/appointment-actions";

export function ReportAppointmentDisputeButton({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleReport = () => {
    const reason = window.prompt(
      "Descreva o problema da consulta para congelar o valor em disputa.",
    );

    if (!reason) return;

    startTransition(async () => {
      const result = await reportHealthAppointmentDispute(
        appointmentId,
        reason,
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Disputa aberta. O valor ficara congelado para analise.");
    });
  };

  return (
    <button
      type="button"
      onClick={handleReport}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded-xl transition-all border border-yellow-500/20 disabled:opacity-60 disabled:cursor-wait"
    >
      <AlertTriangle className="w-4 h-4" />
      {isPending ? "Abrindo..." : "Reportar problema"}
    </button>
  );
}
