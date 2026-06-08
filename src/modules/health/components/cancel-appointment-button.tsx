"use client";

import { useTransition } from "react";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { cancelPatientAppointment } from "@/modules/health/actions/appointment-actions";

export function CancelAppointmentButton({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar esta consulta? O horario sera liberado na agenda do profissional.",
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await cancelPatientAppointment(appointmentId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Consulta cancelada com sucesso.");
    });
  };

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={isPending}
      className="flex cursor-pointer items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold rounded-xl transition-all border border-red-500/20 disabled:opacity-60 disabled:cursor-wait"
    >
      <XCircle className="w-4 h-4" />
      {isPending ? "Cancelando..." : "Cancelar"}
    </button>
  );
}

