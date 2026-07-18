"use server";

import { db } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import { getRateLimitKeys } from "@/lib/rate-limit";
import { getBookableHealthProfessionalWhere } from "@/modules/health/lib/health-professional-eligibility";
import {
  addMinutes,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  parse,
  startOfDay,
  startOfMonth,
} from "date-fns";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MIN_SESSION_MINUTES = 5;
const MAX_SESSION_MINUTES = 480;

export type MonthlySlotsResult = {
  slots: Record<string, string[]>;
  error?: string;
};

function requestedMonth(month: string, now: Date) {
  const match = MONTH_PATTERN.exec(month);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const requested = new Date(year, monthIndex, 1);
  const current = startOfMonth(now);
  const next = startOfMonth(addMonths(now, 1));

  if (
    requested.getFullYear() !== year ||
    requested.getMonth() !== monthIndex ||
    (requested.getTime() !== current.getTime() &&
      requested.getTime() !== next.getTime())
  ) {
    return null;
  }

  return requested;
}

export async function getMonthlySlots(
  proId: string,
  month: string,
): Promise<MonthlySlotsResult> {
  if (
    typeof proId !== "string" ||
    !UUID_PATTERN.test(proId) ||
    typeof month !== "string"
  ) {
    return { slots: {}, error: "Agenda solicitada invalida." };
  }

  const now = new Date();
  const monthStart = requestedMonth(month, now);
  if (!monthStart) {
    return { slots: {}, error: "Mes fora da janela de agendamento." };
  }

  const rateLimitKeys = await getRateLimitKeys("health:public-slots");
  for (const key of rateLimitKeys) {
    const error = await consumeRateLimit({
      key,
      limit: 90,
      windowMs: 60_000,
      message: "Muitas consultas de agenda. Aguarde um minuto e tente novamente.",
    });
    if (error) return { slots: {}, error };
  }

  const professional = await db.user.findFirst({
    where: {
      id: proId,
      ...getBookableHealthProfessionalWhere(now),
    },
    select: {
      sessionDuration: true,
      availabilities: {
        where: { isActive: true },
        select: {
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          isActive: true,
        },
      },
    },
  });

  const durationMinutes = professional?.sessionDuration;
  if (
    !professional ||
    !Number.isInteger(durationMinutes) ||
    Number(durationMinutes) < MIN_SESSION_MINUTES ||
    Number(durationMinutes) > MAX_SESSION_MINUTES
  ) {
    return { slots: {}, error: "Profissional indisponivel para agendamento." };
  }
  const duration = Number(durationMinutes);

  const endDate = endOfMonth(monthStart);
  const [exceptions, appointments, holds] = await Promise.all([
    db.availabilityException.findMany({
      where: {
        professionalId: proId,
        date: { gte: monthStart, lte: endDate },
      },
      select: { date: true, isAvailable: true },
    }),
    db.appointment.findMany({
      where: {
        professionalId: proId,
        date: { gte: monthStart, lte: endDate },
        status: { not: "CANCELED" },
      },
      select: { date: true, time: true },
    }),
    db.appointmentHold.findMany({
      where: {
        professionalId: proId,
        date: { gte: monthStart, lte: endDate },
        expiresAt: { gt: now },
      },
      select: { date: true, time: true },
    }),
  ]);

  const blockedDates = new Set(
    exceptions
      .filter((exception) => !exception.isAvailable)
      .map((exception) => format(exception.date, "yyyy-MM-dd")),
  );
  const occupiedSlots = new Set([
    ...appointments.map(
      (appointment) =>
        `${format(appointment.date, "yyyy-MM-dd")}|${appointment.time}`,
    ),
    ...holds.map(
      (hold) => `${format(hold.date, "yyyy-MM-dd")}|${hold.time}`,
    ),
  ]);
  const availabilityByDay = new Map(
    professional.availabilities
      .filter(
        (availability) =>
          Number.isInteger(availability.dayOfWeek) &&
          availability.dayOfWeek >= 0 &&
          availability.dayOfWeek <= 6 &&
          TIME_PATTERN.test(availability.startTime) &&
          TIME_PATTERN.test(availability.endTime) &&
          availability.startTime < availability.endTime,
      )
      .map((availability) => [availability.dayOfWeek, availability]),
  );

  const slots: Record<string, string[]> = {};
  for (const date of eachDayOfInterval({ start: monthStart, end: endDate })) {
    if (isBefore(startOfDay(date), startOfDay(now))) continue;

    const dateKey = format(date, "yyyy-MM-dd");
    if (blockedDates.has(dateKey)) continue;

    const rule = availabilityByDay.get(date.getDay());
    if (!rule) continue;

    let currentSlot = parse(rule.startTime, "HH:mm", date);
    const endSlot = parse(rule.endTime, "HH:mm", date);
    const availableTimes: string[] = [];

    while (addMinutes(currentSlot, duration) <= endSlot) {
      if (!isBefore(currentSlot, now)) {
        const time = format(currentSlot, "HH:mm");
        if (!occupiedSlots.has(`${dateKey}|${time}`)) {
          availableTimes.push(time);
        }
      }
      currentSlot = addMinutes(currentSlot, duration);
    }

    if (availableTimes.length > 0) slots[dateKey] = availableTimes;
  }

  return { slots };
}
