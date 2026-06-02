import { db } from "@/lib/prisma";

export async function getHealthProfessionalDashboardById(userId: string) {
  return await db.user.findUnique({
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
      consultationFee: true,

      sessionDuration: true, // Puxa o tempo da consulta (ex: 50 min)
      availabilities: true, // <--- TABELA NOVA, // Puxa a grade de horários (JSON)
      exceptions: true, // <--- TABELA NOVA, // Puxa as exceções de horários (JSON)

      proAppointments: {
        orderBy: [{ date: "asc" }, { time: "asc" }],
        select: {
          id: true,
          date: true,
          time: true,
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
        },
      },
    },
  });
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
          status: true,
          price: true,
          meetLink: true,
          notes: true,
          professional: {
            select: {
              id: true,
              name: true,
              displayName: true,
              image: true,
              jobTitle: true,
              approach: true,
            },
          },
        },
      },
    },
  });
}
