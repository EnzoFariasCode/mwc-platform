import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const PROFESSIONAL_APPOINTMENTS_PAGE_SIZE = 10;
const finishedAppointmentStatuses = [
  "CANCELLING",
  "COMPLETED",
  "CANCELED",
  "REFUNDED",
  "NO_SHOW",
  "MEETING_FAILED",
] as const;

const dashboardAppointmentSelect = {
  id: true,
  date: true,
  time: true,
  durationMinutes: true,
  timezonePro: true,
  status: true,
  price: true,
  meetLink: true,
  notes: true,
  patient: {
    select: {
      id: true,
      name: true,
      displayName: true,
      image: true,
    },
  },
} satisfies Prisma.AppointmentSelect;

function normalizePage(page: number, totalItems: number) {
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / PROFESSIONAL_APPOINTMENTS_PAGE_SIZE),
  );
  return {
    page: Math.min(Math.max(Math.trunc(page) || 1, 1), totalPages),
    totalPages,
    totalItems,
    pageSize: PROFESSIONAL_APPOINTMENTS_PAGE_SIZE,
  };
}

export async function getHealthProfessionalDashboardById(
  userId: string,
  pages: { scheduledPage?: number; historyPage?: number } = {},
) {
  const professional = await db.user.findUnique({
    where: {
      id: userId,
      userType: "PROFESSIONAL", // Garante que é profissional
      industry: "HEALTH", // Garante que é da área da saúde
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      image: true,
      jobTitle: true,
      documentReg: true,
      approach: true,
      city: true,
      state: true,
      rating: true,
      ratingCount: true,
      pendingBalance: true,
      consultationFee: true,

      sessionDuration: true, // Puxa o tempo da consulta (ex: 50 min)
      timezone: true,
      availabilities: true, // <--- TABELA NOVA, // Puxa a grade de horários (JSON)
      exceptions: true, // <--- TABELA NOVA, // Puxa as exceções de horários (JSON)
    },
  });

  if (!professional) return null;

  const scheduledWhere: Prisma.AppointmentWhereInput = {
    professionalId: userId,
    status: { notIn: [...finishedAppointmentStatuses] },
  };
  const historyWhere: Prisma.AppointmentWhereInput = {
    professionalId: userId,
    status: { in: [...finishedAppointmentStatuses] },
  };

  const [scheduledCount, historyCount, completedAppointmentsCount] =
    await Promise.all([
      db.appointment.count({ where: scheduledWhere }),
      db.appointment.count({ where: historyWhere }),
      db.appointment.count({
        where: { professionalId: userId, status: "COMPLETED" },
      }),
    ]);
  const scheduledPagination = normalizePage(
    pages.scheduledPage ?? 1,
    scheduledCount,
  );
  const historyPagination = normalizePage(
    pages.historyPage ?? 1,
    historyCount,
  );

  const [scheduledAppointments, historyAppointments] = await Promise.all([
    db.appointment.findMany({
      where: scheduledWhere,
      orderBy: [{ date: "asc" }, { time: "asc" }],
      skip:
        (scheduledPagination.page - 1) * PROFESSIONAL_APPOINTMENTS_PAGE_SIZE,
      take: PROFESSIONAL_APPOINTMENTS_PAGE_SIZE,
      select: dashboardAppointmentSelect,
    }),
    db.appointment.findMany({
      where: historyWhere,
      orderBy: [{ date: "desc" }, { time: "desc" }],
      skip: (historyPagination.page - 1) * PROFESSIONAL_APPOINTMENTS_PAGE_SIZE,
      take: PROFESSIONAL_APPOINTMENTS_PAGE_SIZE,
      select: dashboardAppointmentSelect,
    }),
  ]);

  return {
    ...professional,
    proAppointments: [...scheduledAppointments, ...historyAppointments],
    completedAppointmentsCount,
    appointmentPagination: {
      scheduled: scheduledPagination,
      history: historyPagination,
    },
  };
}

export async function getHealthPatientHistoryById(userId: string) {
  return await db.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      image: true,
      city: true,
      state: true,
      patientAppointments: {
        orderBy: [{ date: "asc" }, { time: "asc" }],
        select: {
          id: true,
          date: true,
          time: true,
          timezonePro: true,
          status: true,
          price: true,
          meetLink: true,
          notes: true,
          healthReview: { select: { id: true } },
          professional: {
            select: {
              id: true,
              name: true,
              displayName: true,
              image: true,
              profileImageBytes: true,
              jobTitle: true,
              approach: true,
            },
          },
        },
      },
    },
  });
}
