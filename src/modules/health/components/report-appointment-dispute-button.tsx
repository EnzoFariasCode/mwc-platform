"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { reportHealthAppointmentDispute } from "@/modules/health/actions/appointment-actions";
import { AppointmentReasonModal } from "./appointment-reason-modal";

export function ReportAppointmentDisputeButton({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReport = (reason: string) => {
    startTransition(async () => {
      const result = await reportHealthAppointmentDispute(
        appointmentId,
        reason,
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setIsModalOpen(false);
      toast.success("Solicitacao registrada. O reembolso foi solicitado ao Stripe.");
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={isPending}
        className="flex cursor-pointer items-center gap-2 px-4 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded-xl transition-all border border-yellow-500/20 disabled:opacity-60 disabled:cursor-wait"
      >
        <AlertTriangle className="w-4 h-4" />
        {isPending ? "Solicitando..." : "Solicitar reembolso"}
      </button>

      <AppointmentReasonModal
        isOpen={isModalOpen}
        title="Solicitar reembolso"
        description="Explique o problema ocorrido na consulta."
        summary="Se o profissional cancelou ou nao compareceu, o reembolso integral sera solicitado ao Stripe e o valor pendente sera removido do profissional."
        confirmLabel="Solicitar reembolso"
        isLoading={isPending}
        options={[
          { value: "profissional_ausente", label: "Profissional nao compareceu" },
          { value: "problema_link", label: "Problema no link da consulta" },
          { value: "consulta_nao_realizada", label: "Consulta nao foi realizada" },
          { value: "outro", label: "Outro problema" },
        ]}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleReport}
      />
    </>
  );
}


