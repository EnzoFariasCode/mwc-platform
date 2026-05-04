"use client";

import { useState } from "react";
import { X, Save, Clock, CalendarDays } from "lucide-react";
import {
  updateHealthSchedule,
  type WeeklyAvailability,
  type DaySchedule,
} from "../actions/update-health-schedule";

type EditScheduleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  professional: any;
};

const defaultSchedule: WeeklyAvailability = {
  segunda: { active: true, start: "09:00", end: "18:00" },
  terca: { active: true, start: "09:00", end: "18:00" },
  quarta: { active: true, start: "09:00", end: "18:00" },
  quinta: { active: true, start: "09:00", end: "18:00" },
  sexta: { active: true, start: "09:00", end: "18:00" },
  sabado: { active: false, start: "09:00", end: "12:00" },
  domingo: { active: false, start: "00:00", end: "00:00" },
};

const diasDaSemana: { key: keyof WeeklyAvailability; label: string }[] = [
  { key: "segunda", label: "Segunda-feira" },
  { key: "terca", label: "Terça-feira" },
  { key: "quarta", label: "Quarta-feira" },
  { key: "quinta", label: "Quinta-feira" },
  { key: "sexta", label: "Sexta-feira" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

export function EditScheduleModal({
  isOpen,
  onClose,
  professional,
}: EditScheduleModalProps) {
  const [schedule, setSchedule] = useState<WeeklyAvailability>(() => {
    const saved = professional?.availability;
    if (!saved || Object.keys(saved).length === 0) return defaultSchedule;
    return saved as WeeklyAvailability;
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleUpdateDay = (
    dayKey: keyof WeeklyAvailability,
    field: keyof DaySchedule,
    value: string | boolean,
  ) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateHealthSchedule(schedule);
    setIsSaving(false);

    if (result.error) {
      alert(result.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 font-poppins">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* MODAL CONTAINER: Max height control e overflow hidden */}
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden">
        {/* HEADER: Fixo no topo */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-white/5 shrink-0 bg-[#0f172a] z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#d73cbe]" />
              Sua Agenda
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Defina seus dias e horários de disponibilidade.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors shrink-0 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY: Área com rolagem independente */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3 sm:space-y-4">
          {diasDaSemana.map((dia) => {
            const data = schedule[dia.key as keyof typeof schedule];

            return (
              <div
                key={dia.key}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-4 sm:gap-0 ${data.active ? "bg-[#020617] border-[#d73cbe]/30" : "bg-white/5 border-white/5 opacity-60"}`}
              >
                {/* Checkbox Liga/Desliga */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.active}
                    onChange={(e) =>
                      handleUpdateDay(dia.key, "active", e.target.checked)
                    }
                    className="w-5 h-5 rounded border-white/20 text-[#d73cbe] focus:ring-[#d73cbe] bg-transparent cursor-pointer shrink-0"
                  />
                  <span
                    className={`font-semibold text-sm sm:text-base ${data.active ? "text-white" : "text-slate-400"}`}
                  >
                    {dia.label}
                  </span>
                </label>

                {/* Controles de Horário (Em celular desce pra próxima linha) */}
                <div className="flex items-center gap-2 sm:gap-3 pl-8 sm:pl-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
                    <input
                      type="time"
                      value={data.start}
                      onChange={(e) =>
                        handleUpdateDay(dia.key, "start", e.target.value)
                      }
                      disabled={!data.active}
                      className="bg-[#0f172a] border border-white/10 rounded-lg px-2 py-1.5 text-xs sm:text-sm text-white focus:border-[#d73cbe] outline-none disabled:opacity-50 w-[75px] sm:w-auto text-center"
                    />
                  </div>
                  <span className="text-slate-500 text-xs sm:text-sm">até</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={data.end}
                      onChange={(e) =>
                        handleUpdateDay(dia.key, "end", e.target.value)
                      }
                      disabled={!data.active}
                      className="bg-[#0f172a] border border-white/10 rounded-lg px-2 py-1.5 text-xs sm:text-sm text-white focus:border-[#d73cbe] outline-none disabled:opacity-50 w-[75px] sm:w-auto text-center"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER: Fixo na base */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 p-5 sm:p-6 border-t border-white/5 shrink-0 bg-[#0f172a] z-10">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-3 sm:py-2.5 text-slate-300 hover:text-white text-sm font-bold rounded-xl border border-white/10 sm:border-none transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-[#d73cbe] hover:bg-[#b02da0] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Salvando..." : "Salvar Agenda"}
          </button>
        </div>
      </div>
    </div>
  );
}
