"use client";

import { useState, useTransition } from "react";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { cancelPatientAppointment } from "@/modules/health/actions/appointment-actions";
import { AppointmentReasonModal } from "./appointment-reason-modal";

export function CancelAppointmentButton({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCancel = (reason: string) => {
    startTransition(async () => {
      const result = await cancelPatientAppointment(appointmentId, reason);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setIsModalOpen(false);
      toast.success("Consulta cancelada com sucesso.");
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={isPending}
        className="flex cursor-pointer items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold rounded-xl transition-all border border-red-500/20 disabled:opacity-60 disabled:cursor-wait"
      >
        <XCircle className="w-4 h-4" />
        {isPending ? "Cancelando..." : "Cancelar"}
      </button>

      <AppointmentReasonModal
        isOpen={isModalOpen}
        title="Cancelar consulta"
        description="Informe o motivo do cancelamento antes de continuar."
        summary="Cancelamentos com mais de 24h geram reembolso integral. Com menos de 24h, nao ha reembolso e o valor e liberado ao profissional."
        confirmLabel="Confirmar cancelamento"
        isLoading={isPending}
        options={[
          { value: "agenda", label: "Nao poderei comparecer" },
          { value: "horario", label: "Horario nao atende mais" },
          { value: "outro_profissional", label: "Escolhi outro profissional" },
          { value: "outro", label: "Outro motivo" },
        ]}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCancel}
      />
    </>
  );
}

