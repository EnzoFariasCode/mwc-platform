"use client";

import { useState, useEffect } from "react";
import { getMonthlySlots } from "@/modules/health/actions/get-monthly-slots"; // <-- Nova Action
import { useRouter } from "next/navigation";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, ArrowRight } from "lucide-react";

import type { HealthAvailability } from "@/modules/health/types";

interface MonthlyScheduleProps {
  pro: {
    id: string;
    sessionDuration?: number;
    consultationFee?: number | string;
    availability?: HealthAvailability;
  };
  readOnly?: boolean;
}

export function MonthlyScheduleClient({
  pro,
  readOnly = false,
}: MonthlyScheduleProps) {
  const router = useRouter();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // <-- NOVO: Guardamos um mapa dos dias com horários livres (ex: { '2026-05-27': ['08:00', '09:00'] })
  const [monthlySlots, setMonthlySlots] = useState<Record<string, string[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);

  const duration = pro.sessionDuration || 50;

  const priceFormatted = pro.consultationFee
    ? Number(pro.consultationFee).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : "R$ 150,00";

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const maxFutureMonth = addMonths(new Date(), 1);
  const isAtMaxMonth = !isBefore(
    startOfMonth(currentMonth),
    startOfMonth(maxFutureMonth),
  );
  const isAtMinMonth = !isBefore(
    startOfMonth(new Date()),
    startOfMonth(currentMonth),
  );

  // <-- NOVO: Ao mudar o mês, pedimos a agenda limpa pro servidor
  useEffect(() => {
    async function fetchSlots() {
      setIsLoading(true);
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const slotsMap = await getMonthlySlots(pro.id, start, end, duration);
      setMonthlySlots(slotsMap);
      setIsLoading(false);
    }

    if (pro.id) {
      fetchSlots();
    }
  }, [pro.id, currentMonth, duration]);

  const slotsRealmenteDisponiveis = selectedDate
    ? monthlySlots[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  const handleProceed = () => {
    if (readOnly) return;

    if (selectedDate && selectedTime) {
      router.push(
        `/checkout-saude?proId=${pro.id}&time=${selectedTime}&date=${format(
          selectedDate,
          "yyyy-MM-dd",
        )}`,
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* PREÇO + DURAÇÃO */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <Clock className="w-3.5 h-3.5 text-[#d73cbe]" />
          <span>{duration} min</span>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-500 uppercase tracking-wider leading-none mb-0.5">
            Valor da Sessão
          </p>
          <p className="text-lg font-bold text-[#d73cbe] leading-none">
            {priceFormatted}
          </p>
        </div>
      </div>

      {/* CONTROLES DO MÊS */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          disabled={isAtMinMonth || isLoading}
          className="w-6 h-6 rounded-md border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <span className="text-xs font-semibold text-white capitalize">
          {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
        </span>

        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          disabled={isAtMaxMonth || isLoading}
          className="w-6 h-6 rounded-md border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* GRID DO CALENDÁRIO */}
      <div className="grid grid-cols-7 gap-1 mb-4 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
          <div key={i} className="text-[9px] font-bold text-slate-600 mb-1">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDayOfMonth.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {daysInMonth.map((date) => {
          const isPast = isBefore(startOfDay(date), startOfDay(new Date()));
          const dateStr = format(date, "yyyy-MM-dd");

          // O servidor já fez a conta. Se tem array no mapa, é porque tem vaga.
          const isAvailable =
            !isPast && monthlySlots[dateStr]?.length > 0 && !isLoading;
          const isSelected = selectedDate && isSameDay(date, selectedDate);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => {
                if (isAvailable && !readOnly) {
                  setSelectedDate(date);
                  setSelectedTime(null);
                }
              }}
              disabled={!isAvailable || readOnly}
              className={`
                h-7 w-full rounded-md text-xs flex items-center justify-center transition-all
                ${
                  isSelected
                    ? "bg-[#d73cbe] text-white font-bold shadow-md shadow-[#d73cbe]/30 cursor-default ring-1 ring-offset-1 ring-offset-[#020617] ring-[#d73cbe]"
                    : ""
                }
                ${
                  !isSelected && isAvailable && !readOnly
                    ? "text-slate-200 bg-white/5 hover:bg-white/10 hover:text-[#d73cbe] border border-white/10 cursor-pointer"
                    : ""
                }
                ${
                  !isSelected && (!isAvailable || readOnly)
                    ? "text-slate-700 opacity-30 cursor-not-allowed"
                    : ""
                }
              `}
            >
              {format(date, "d")}
            </button>
          );
        })}
      </div>

      {/* HORÁRIOS */}
      {selectedDate && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
            Horários — {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </h4>

          {isLoading ? (
            <div className="text-center p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-500 animate-pulse">
              Carregando agenda...
            </div>
          ) : slotsRealmenteDisponiveis.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto pr-0.5 custom-scrollbar">
              {slotsRealmenteDisponiveis.map((time) => {
                const isSelectedTime = selectedTime === time;

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      if (!readOnly) setSelectedTime(time);
                    }}
                    disabled={readOnly}
                    className={`py-1.5 text-[11px] font-medium text-center rounded-lg transition-all ${
                      isSelectedTime
                        ? "bg-[#d73cbe] text-white border border-[#d73cbe] shadow-md shadow-[#d73cbe]/30"
                        : readOnly
                          ? "text-slate-600 bg-white/5 border border-white/10 cursor-not-allowed"
                          : "text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-[#d73cbe] hover:border-[#d73cbe]/50 cursor-pointer"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-500">
              Nenhum horário livre neste dia.
            </div>
          )}
        </div>
      )}

      {/* RODAPÉ & BOTÃO PROSSEGUIR */}
      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-4">
        <p className="text-[9px] text-slate-600 leading-relaxed max-w-[120px]">
          {readOnly
            ? "Visualizacao da sua agenda publica."
            : "Cancelamento gratuito até 24h antes."}
        </p>

        <button
          onClick={handleProceed}
          disabled={!selectedTime || readOnly}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            selectedTime && !readOnly
              ? "bg-[#d73cbe] text-white shadow-lg shadow-[#d73cbe]/30 hover:bg-[#b02b9b] cursor-pointer active:scale-95"
              : "bg-white/5 text-slate-500 cursor-not-allowed"
          }`}
        >
          Prosseguir <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
