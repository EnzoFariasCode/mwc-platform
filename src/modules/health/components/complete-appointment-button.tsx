"use client";

import { useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { completeHealthAppointment } from "@/modules/health/actions/appointment-actions";

export function CompleteAppointmentButton({
  appointmentId,
  disabled,
}: {
  appointmentId: string;
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleComplete = () => {
    const confirmed = window.confirm(
      "Confirmar que esta consulta foi realizada? O valor pendente sera liberado para saque.",
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await completeHealthAppointment(appointmentId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Consulta marcada como concluida.");
    });
  };

  return (
    <button
      type="button"
      onClick={handleComplete}
      disabled={disabled || isPending}
      title={
        disabled
          ? "Disponivel somente apos o horario da consulta."
          : "Marcar consulta como concluida"
      }
      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <CheckCircle2 className="h-4 w-4" />
      {isPending ? "Concluindo..." : "Marcar como concluida"}
    </button>
  );
}

