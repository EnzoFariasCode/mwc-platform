"use client";

import { useTransition } from "react";
import { AlertTriangle, CalendarClock, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  cancelProfessionalAppointment,
  markPatientNoShowAppointment,
} from "@/modules/health/actions/appointment-actions";

export function ProfessionalAppointmentActionButtons({
  appointmentId,
  canMarkNoShow,
}: {
  appointmentId: string;
  canMarkNoShow: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    const confirmed = window.confirm(
      "Cancelar esta consulta? O paciente recebera reembolso pelo Stripe e o horario sera liberado.",
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await cancelProfessionalAppointment(appointmentId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Consulta cancelada e reembolso solicitado.");
    });
  };

  const handleNoShow = () => {
    const confirmed = window.confirm(
      "Confirmar que o paciente nao compareceu? O valor pendente sera liberado para sua carteira.",
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await markPatientNoShowAppointment(appointmentId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Ausencia do paciente registrada.");
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-300 transition-all hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60"
      >
        <XCircle className="h-4 w-4" />
        Cancelar
      </button>

      <button
        type="button"
        disabled
        title="Reagendamento exige escolha de novo horario e sera implementado no proximo passo."
        className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-500 opacity-70"
      >
        <CalendarClock className="h-4 w-4" />
        Reagendar
      </button>

      <button
        type="button"
        onClick={handleNoShow}
        disabled={isPending || !canMarkNoShow}
        title={
          canMarkNoShow
            ? "Marcar paciente como ausente"
            : "Disponivel somente apos o horario da consulta."
        }
        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2.5 text-xs font-bold text-yellow-300 transition-all hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <AlertTriangle className="h-4 w-4" />
        Paciente ausente
      </button>
    </div>
  );
}
