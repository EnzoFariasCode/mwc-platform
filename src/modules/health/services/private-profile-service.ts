import { db } from "@/lib/prisma";

export async function getHealthProfessionalDashboardById(userId: string) {
  return await db.user.findUnique({
    where: {
      id: userId,
      userType: "PROFESSIONAL",
      industry: "HEALTH",
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
      proAppointments: {
        orderBy: { date: "asc" },
        select: {
          id: true,
          date: true,
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
        orderBy: { date: "asc" },
        select: {
          id: true,
          date: true,
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
