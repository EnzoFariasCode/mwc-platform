import { db } from "@/lib/prisma";
import { healthSpecialties } from "@/modules/health/lib/specialties";
import {
  getBookableHealthProfessionalWhere,
  getHealthProfessionalBookingReadinessError,
} from "@/modules/health/lib/health-professional-eligibility";

export async function getHealthSpecialtyCards() {
  const candidates = await db.user.findMany({
    where: getBookableHealthProfessionalWhere(),
    select: {
      onlineSpecialty: true,
      teachingSubject: true,
      documentReg: true,
      jobTitle: true,
      consultationFee: true,
      sessionDuration: true,
      timezone: true,
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

  const counts = new Map<string, number>();
  for (const professional of candidates) {
    if (
      professional.onlineSpecialty &&
      !getHealthProfessionalBookingReadinessError(professional)
    ) {
      counts.set(
        professional.onlineSpecialty,
        (counts.get(professional.onlineSpecialty) ?? 0) + 1,
      );
    }
  }

  return healthSpecialties.map((specialty) => ({
    ...specialty,
    count: counts.get(specialty.code) ?? 0,
  }));
}
