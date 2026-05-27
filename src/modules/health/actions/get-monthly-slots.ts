// src/modules/health/actions/get-monthly-slots.ts
"use server";

import { db } from "@/lib/prisma";
import {
  format,
  addMinutes,
  parse,
  isBefore,
  startOfDay,
  eachDayOfInterval,
} from "date-fns";

export async function getMonthlySlots(
  proId: string,
  startDate: Date,
  endDate: Date,
  durationMinutes: number = 50,
) {
  // 1. Busca os dias da semana em que o profissional trabalha
  const availabilities = await db.professionalAvailability.findMany({
    where: { professionalId: proId, isActive: true },
  });

  // 2. Busca as folgas e feriados (Exceções)
  const exceptions = await db.availabilityException.findMany({
    where: { professionalId: proId, date: { gte: startDate, lte: endDate } },
  });

  // 3. Busca consultas já pagas ou confirmadas
  const appointments = await db.appointment.findMany({
    where: {
      professionalId: proId,
      date: { gte: startDate, lte: endDate },
      status: { not: "CANCELED" },
    },
  });

  // 4. Busca reservas atômicas (Holds) ativas de outros pacientes
  const now = new Date();
  const holds = await db.appointmentHold.findMany({
    where: {
      professionalId: proId,
      date: { gte: startDate, lte: endDate },
      expiresAt: { gt: now }, // Só considera holds que ainda não expiraram
    },
  });

  const slotsMap: Record<string, string[]> = {};
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  for (const date of days) {
    const dateStr = format(date, "yyyy-MM-dd");
    if (isBefore(startOfDay(date), startOfDay(now))) continue; // Ignora o passado

    // Checa se o médico tirou folga neste dia
    const exception = exceptions.find(
      (e) => format(e.date, "yyyy-MM-dd") === dateStr,
    );
    if (exception && !exception.isAvailable) continue;

    // Checa se ele trabalha neste dia da semana (0 = Dom, 1 = Seg...)
    const dayOfWeek = date.getDay();
    const rule = availabilities.find((a) => a.dayOfWeek === dayOfWeek);
    if (!rule) continue;

    // Gera os horários do dia
    const daySlots: string[] = [];
    let currentSlot = parse(rule.startTime, "HH:mm", date);
    const endSlot = parse(rule.endTime, "HH:mm", date);

    while (addMinutes(currentSlot, durationMinutes) <= endSlot) {
      if (isBefore(currentSlot, now)) {
        currentSlot = addMinutes(currentSlot, durationMinutes);
        continue;
      }

      const timeStr = format(currentSlot, "HH:mm");

      // Bate o horário contra agendamentos e holds temporários
      const isBooked = appointments.some(
        (a) => format(a.date, "yyyy-MM-dd") === dateStr && a.time === timeStr,
      );
      const isHeld = holds.some(
        (h) => format(h.date, "yyyy-MM-dd") === dateStr && h.time === timeStr,
      );

      if (!isBooked && !isHeld) {
        daySlots.push(timeStr);
      }

      currentSlot = addMinutes(currentSlot, durationMinutes);
    }

    // Se sobrou algum horário livre no dia, adiciona ao mapa
    if (daySlots.length > 0) {
      slotsMap[dateStr] = daySlots;
    }
  }

  return slotsMap; // Retorna ex: { "2026-05-27": ["08:00", "09:00"] }
}
