"use server";

import { db } from "@/lib/prisma";
import { format } from "date-fns";

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
        status: { not: "CANCELED" },
      },
      select: {
        date: true,
        time: true,
      },
    });

    return appointments.map(
      (app) => `${format(app.date, "yyyy-MM-dd")}|${app.time}`,
    );
  } catch (error) {
    console.error("[GET_BOOKED_SLOTS_ERROR]", error);
    return [];
  }
}
