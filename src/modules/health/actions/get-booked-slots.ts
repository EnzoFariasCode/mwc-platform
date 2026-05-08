"use server";

import { db } from "@/lib/prisma";

export async function getBookedSlots(
  professionalId: string,
  startDate: Date,
  endDate: Date,
) {
  try {
    const appointments = await db.appointment.findMany({
      where: {
        professionalId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        // Se no futuro você adicionar cancelamentos, pode colocar um filtro aqui:
        // status: { not: "CANCELED" }
      },
      select: {
        date: true,
      },
    });

    // Retornamos um array de strings ISO para facilitar a comparação no Front-end
    return appointments.map((app) => app.date.toISOString());
  } catch (error) {
    console.error("[GET_BOOKED_SLOTS_ERROR]", error);
    return [];
  }
}
