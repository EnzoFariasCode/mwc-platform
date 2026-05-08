"use client";

import { useState, useEffect } from "react";
import { getBookedSlots } from "@/modules/health/actions/get-booked-slots";
import Link from "next/link";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parse,
  addMinutes,
  isBefore,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface MonthlyScheduleProps {
  pro: {
    id: string;
    availability?:
      | Record<string, { active: boolean; start: string; end: string }>
      | string;
    sessionDuration?: number;
    consultationFee?: number | string;
  };
}

const dayMap = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
];

export function MonthlyScheduleClient({ pro }: MonthlyScheduleProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const rawAvailability = pro.availability || {};
  const availability =
    typeof rawAvailability === "string"
      ? JSON.parse(rawAvailability)
      : rawAvailability;

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

  useEffect(() => {
    async function fetchBookedSlots() {
      const currentYear = currentMonth.getFullYear();
      const currentMonthIndex = currentMonth.getMonth();
      const start = new Date(currentYear, currentMonthIndex, 1);
      const end = new Date(currentYear, currentMonthIndex + 1, 0);

      const slots = await getBookedSlots(pro.id, start, end);
      setBookedSlots(slots);
    }

    if (pro.id) {
      fetchBookedSlots();
    }
  }, [pro.id, currentMonth]);

  const getSlotsForDate = (date: Date) => {
    if (isBefore(startOfDay(date), startOfDay(new Date()))) return [];

    const dayName = dayMap[date.getDay()];
    const dayRule = availability[dayName];

    if (!dayRule || dayRule.active !== true) return [];

    const slots: string[] = [];
    let currentSlot = parse(dayRule.start, "HH:mm", date);
    const endSlot = parse(dayRule.end, "HH:mm", date);
    const now = new Date();

    while (addMinutes(currentSlot, duration) <= endSlot) {
      if (isBefore(currentSlot, now)) {
        currentSlot = addMinutes(currentSlot, duration);
        continue;
      }
      slots.push(format(currentSlot, "HH:mm"));
      currentSlot = addMinutes(currentSlot, duration);
    }

    return slots;
  };

  const availableSlots = selectedDate ? getSlotsForDate(selectedDate) : [];

  const slotsRealmenteDisponiveis = selectedDate
    ? availableSlots.filter((timeString) => {
        const slotDate = new Date(selectedDate);
        const [hours, minutes] = timeString.split(":");
        slotDate.setHours(Number(hours), Number(minutes), 0, 0);

        const isBooked = bookedSlots.includes(slotDate.toISOString());

        return !isBooked;
      })
    : [];

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
          disabled={isAtMinMonth}
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
          disabled={isAtMaxMonth}
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
          const hasConfiguredAvailability =
            availability[dayMap[date.getDay()]]?.active === true;
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isAvailable = !isPast && hasConfiguredAvailability;

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => isAvailable && setSelectedDate(date)}
              disabled={!isAvailable}
              className={`
                h-7 w-full rounded-md text-xs flex items-center justify-center transition-all
                ${
                  isSelected
                    ? "bg-[#d73cbe] text-white font-bold shadow-md shadow-[#d73cbe]/30 cursor-default ring-1 ring-offset-1 ring-offset-[#020617] ring-[#d73cbe]"
                    : ""
                }
                ${
                  !isSelected && isAvailable
                    ? "text-slate-200 bg-white/5 hover:bg-white/10 hover:text-[#d73cbe] border border-white/10 cursor-pointer"
                    : ""
                }
                ${
                  !isSelected && !isAvailable
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

          {slotsRealmenteDisponiveis.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto pr-0.5">
              {slotsRealmenteDisponiveis.map((time) => (
                <Link
                  key={time}
                  href={`/checkout-saude?proId=${pro.id}&time=${time}&date=${format(selectedDate, "yyyy-MM-dd")}`}
                  className="py-1.5 text-[11px] font-medium text-center text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-[#d73cbe] hover:text-white hover:border-[#d73cbe] transition-all"
                >
                  {time}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-500">
              Nenhum horário livre neste dia.
            </div>
          )}
        </div>
      )}

      <p className="text-[9px] text-center text-slate-600 leading-relaxed pt-3 mt-auto border-t border-white/5">
        Cancelamento gratuito até 24h antes.
      </p>
    </div>
  );
}
