"use client";

import { useState } from "react";
import { CalendarClock, X, AlertTriangle } from "lucide-react";

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  appointmentId: string;
  currentDate: string;
  currentTime: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (newDate: string, newTime: string) => void;
}

export function RescheduleAppointmentModal({
  isOpen,
  currentDate,
  currentTime,
  isLoading = false,
  onClose,
  onConfirm,
}: RescheduleAppointmentModalProps) {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  if (!isOpen) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2, 0);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const canConfirm = newDate.length === 10 && newTime.length === 5 && !isLoading;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(newDate, newTime);
    }
  };

  const formattedCurrentDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(currentDate));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <CalendarClock className="w-5 h-5 text-[#d73cbe]" />
            <h2 className="text-lg font-bold text-white">
              Reagendar consulta
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar reagendamento"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-400">
            <p className="text-slate-300 font-medium mb-1">Horario atual</p>
            <p>
              {formattedCurrentDate} as {currentTime}
            </p>
          </div>

          <div className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-300 leading-relaxed">
              O reagendamento so e permitido com pelo menos 24 horas de
              antecedencia. O pagamento original permanece valido. O paciente
              sera notificado por e-mail.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Nova data
            </label>
            <input
              type="date"
              value={newDate}
              min={minDate}
              max={maxDateStr}
              onKeyDown={(event) => event.preventDefault()}
              onPaste={(event) => event.preventDefault()}
              onChange={(event) => setNewDate(event.target.value)}
              disabled={isLoading}
              className="w-full cursor-pointer bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#d73cbe]/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-slate-500">
              Selecione a data pelo calendario. Datas fora da agenda do
              profissional serao recusadas automaticamente.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Novo horario
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(event) => setNewTime(event.target.value)}
              disabled={isLoading}
              className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#d73cbe]/50 transition-colors disabled:opacity-50"
            />
            <p className="text-xs text-slate-500">
              Certifique-se de que o horario esta dentro da sua agenda
              configurada.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end px-6 py-5 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${
              canConfirm
                ? "bg-[#d73cbe] hover:bg-[#c032a8] text-white cursor-pointer shadow-lg shadow-[#d73cbe]/20 active:scale-95"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CalendarClock className="w-4 h-4" />
                Confirmar reagendamento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
