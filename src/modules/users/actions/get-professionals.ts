"use server";

import { db } from "@/lib/prisma";
import { getHealthSpecialtyById } from "@/modules/health/lib/specialties";
import {
  getBookableHealthProfessionalWhere,
  getHealthProfessionalBookingReadinessError,
} from "@/modules/health/lib/health-professional-eligibility";

export async function getProfessionalsBySpecialty(specialtyId: string) {
  try {
    const specialty = getHealthSpecialtyById(specialtyId.toLowerCase());

    if (!specialty) {
      return { data: [] };
    }

    const professionals = await db.user.findMany({
      where: {
        ...getBookableHealthProfessionalWhere(),
        onlineSpecialty: specialty.code,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        bio: true,
        rating: true,
        ratingCount: true,
        jobTitle: true,
        onlineSpecialty: true,
        teachingSubject: true,
        documentReg: true,
        consultationFee: true,
        industry: true,
        image: true,
        sessionDuration: true,
        approach: true,
        city: true,
        state: true,
        profileImageBytes: true,
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

    const validProfessionals = professionals
      .filter((pro) => !getHealthProfessionalBookingReadinessError(pro))
      .map((professional) => {
        const { profileImageBytes, availabilities, timezone, ...publicData } =
          professional;
        void availabilities;
        void timezone;
        return {
          ...publicData,
          hasProfileImage: profileImageBytes !== null,
        };
      });

    return { data: validProfessionals };
  } catch (error) {
    console.error("Erro no Back-end:", error);
    return { error: "Falha ao buscar especialistas." };
  }
}
