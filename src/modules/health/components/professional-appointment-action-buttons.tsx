"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarClock, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  cancelProfessionalAppointment,
  markPatientNoShowAppointment,
  rescheduleHealthAppointment,
} from "@/modules/health/actions/appointment-actions";
import { AppointmentReasonModal } from "./appointment-reason-modal";
import { RescheduleAppointmentModal } from "./reschedule-appointment-modal";

export function ProfessionalAppointmentActionButtons({
  appointmentId,
  canMarkNoShow,
  appointmentDate,
  appointmentTime,
}: {
  appointmentId: string;
  canMarkNoShow: boolean;
  appointmentDate: string;
  appointmentTime: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalType, setModalType] = useState<"cancel" | "no-show" | null>(
    null,
  );
  const [showReschedule, setShowReschedule] = useState(false);

  const handleCancel = (reason: string) => {
    startTransition(async () => {
      const result = await cancelProfessionalAppointment(
        appointmentId,
        reason,
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setModalType(null);
      toast.success("Consulta cancelada e reembolso solicitado.");
      router.refresh();
    });
  };

  const handleNoShow = (reason: string) => {
    startTransition(async () => {
      const result = await markPatientNoShowAppointment(appointmentId, reason);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setModalType(null);
      toast.success("Ausencia do paciente registrada.");
      router.refresh();
    });
  };

  const handleReschedule = (newDate: string, newTime: string) => {
    startTransition(async () => {
      const result = await rescheduleHealthAppointment(
        appointmentId,
        newDate,
        newTime,
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setShowReschedule(false);
      toast.success("Consulta reagendada com sucesso. O paciente foi notificado.");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => setModalType("cancel")}
        disabled={isPending}
        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-300 transition-all hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60"
      >
        <XCircle className="h-4 w-4" />
        Cancelar
      </button>

      <button
        type="button"
        onClick={() => setShowReschedule(true)}
        disabled={isPending}
        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#d73cbe]/20 bg-[#d73cbe]/10 px-4 py-2.5 text-xs font-bold text-[#d73cbe] transition-all hover:bg-[#d73cbe]/20 disabled:cursor-wait disabled:opacity-60"
      >
        <CalendarClock className="h-4 w-4" />
        Reagendar
      </button>

      <button
        type="button"
        onClick={() => setModalType("no-show")}
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

      <AppointmentReasonModal
        isOpen={modalType === "cancel"}
        title="Cancelar consulta"
        description="Informe o motivo do cancelamento profissional."
        summary="O paciente recebera reembolso integral pelo Stripe e o valor pendente sera removido dos seus lancamentos futuros."
        confirmLabel="Confirmar cancelamento"
        isLoading={isPending}
        options={[
          { value: "indisponibilidade", label: "Indisponibilidade profissional" },
          { value: "emergencia", label: "Emergencia ou imprevisto" },
          { value: "agenda", label: "Conflito de agenda" },
          { value: "outro", label: "Outro motivo" },
        ]}
        onClose={() => setModalType(null)}
        onConfirm={handleCancel}
      />

      <AppointmentReasonModal
        isOpen={modalType === "no-show"}
        title="Paciente ausente"
        description="Registre a evidencia ou contexto da ausencia."
        summary="O agendamento sera marcado como paciente ausente e o valor pendente sera liberado para sua carteira."
        confirmLabel="Confirmar ausencia"
        isLoading={isPending}
        options={[
          { value: "nao_entrou", label: "Paciente nao entrou na sala" },
          { value: "sem_resposta", label: "Paciente nao respondeu contato" },
          { value: "atraso", label: "Atraso excedeu a tolerancia" },
          { value: "outro", label: "Outro motivo" },
        ]}
        onClose={() => setModalType(null)}
        onConfirm={handleNoShow}
      />

      <RescheduleAppointmentModal
        isOpen={showReschedule}
        appointmentId={appointmentId}
        currentDate={appointmentDate}
        currentTime={appointmentTime}
        isLoading={isPending}
        onClose={() => setShowReschedule(false)}
        onConfirm={handleReschedule}
      />
    </div>
  );
}
