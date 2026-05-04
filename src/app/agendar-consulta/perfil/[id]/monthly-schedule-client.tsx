"use client";

import { useState } from "react";
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
import { ChevronLeft, ChevronRight, Clock, CalendarDays } from "lucide-react";

interface MonthlyScheduleProps {
  pro: any;
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

  // DEFESA DO BACK-END: Garante que o Prisma entregou um Objeto, e não uma String solta
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

  // Dias do mês atual para o calendário
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // NOVA REGRA DE NEGOCIO: Limite maximo de agendamento (Mes atual + 1)
  const maxFutureMonth = addMonths(new Date(), 1);
  const isAtMaxMonth = !isBefore(
    startOfMonth(currentMonth),
    startOfMonth(maxFutureMonth),
  );

  // MOTOR DE SLOTS
  const getSlotsForDate = (date: Date) => {
    if (isBefore(startOfDay(date), startOfDay(new Date()))) return [];

    const dayName = dayMap[date.getDay()];
    const dayRule = availability[dayName];

    // Se não tem regra ou o dia não está ativo, retorna vazio
    if (!dayRule || dayRule.active !== true) return [];

    const slots = [];
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

  return (
    <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-white/10 rounded-2xl p-6 shadow-2xl">
      <h3 className="font-futura font-bold text-xl text-white mb-6 uppercase tracking-tight flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-[#d73cbe]" />
        Agendar Consulta
      </h3>

      <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-slate-300 text-sm">
          <Clock className="w-5 h-5 text-[#d73cbe]" />
          <span>{duration} minutos</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            Valor da Sessão
          </p>
          <p className="text-2xl font-bold text-[#d73cbe]">{priceFormatted}</p>
        </div>
      </div>

      {/* CONTROLES DO MÊS */}
      <div className="flex items-center justify-between mb-4">
        {/* Botão Voltar (Trava no mês atual) */}
        <button 
          type="button" 
          onClick={prevMonth} 
          disabled={isBefore(startOfMonth(currentMonth), startOfMonth(new Date()))} 
          className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <span className="text-sm font-semibold text-white capitalize">
          {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
        </span>
        
        {/* Botão Avançar (Trava no Mês Atual + 1) */}
        <button 
          type="button" 
          onClick={nextMonth} 
          disabled={isAtMaxMonth}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
            isAtMaxMonth 
              ? 'border-white/5 text-slate-600 opacity-40 cursor-not-allowed' 
              : 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* GRID DO CALENDÁRIO */}
      <div className="grid grid-cols-7 gap-2 mb-6 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
          <div key={i} className="text-[10px] font-bold text-slate-500 mb-2">
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

          // Lógica UI/UX: É disponível se não for passado e se o médico atende nesse dia da semana
          const isAvailable = !isPast && hasConfiguredAvailability;

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => isAvailable && setSelectedDate(date)}
              disabled={!isAvailable}
              className={`
                h-10 w-full rounded-lg text-sm flex items-center justify-center transition-all
                ${isSelected ? "bg-[#d73cbe] text-white font-bold shadow-lg shadow-[#d73cbe]/30 cursor-default ring-2 ring-offset-2 ring-offset-[#020617] ring-[#d73cbe]" : ""}
                ${!isSelected && isAvailable ? "text-slate-200 bg-white/5 hover:bg-white/10 hover:text-[#d73cbe] hover:border-[#d73cbe]/50 border border-white/10 cursor-pointer shadow-sm" : ""}
                ${!isSelected && !isAvailable ? "text-slate-600 opacity-40 cursor-not-allowed" : ""}
              `}
            >
              {format(date, "d")}
            </button>
          );
        })}
      </div>

      {/* HORÁRIOS DISPONÍVEIS DO DIA SELECIONADO */}
      {selectedDate && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
            Horários para{" "}
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </h4>

          {availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 mb-6 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {availableSlots.map((time) => (
                <Link
                  key={time}
                  href={`/checkout-saude?proId=${pro.id}&time=${time}&date=${format(selectedDate, "yyyy-MM-dd")}`}
                  className="w-full py-2.5 text-sm font-medium text-center text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-[#d73cbe] hover:text-white hover:border-[#d73cbe] transition-all cursor-pointer"
                >
                  {time}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5 mb-6 text-sm text-slate-400">
              Nenhum horário livre neste dia.
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-center text-slate-500 leading-relaxed pt-4 border-t border-white/5">
        O pagamento é processado via Stripe. <br />
        Cancelamento gratuito até 24h antes do início.
      </p>
    </div>
  );
}
