import { db } from "@/lib/prisma";
import { getHealthSpecialtyById } from "@/modules/health/lib/specialties";
import {
  getBookableHealthProfessionalWhere,
  getHealthProfessionalBookingReadinessError,
} from "@/modules/health/lib/health-professional-eligibility";

export async function getProfessionalsBySpecialty(specialtyId: string) {
  try {
    if (typeof specialtyId !== "string" || specialtyId.length > 40) {
      return { data: [] };
    }

    const specialty = getHealthSpecialtyById(specialtyId);

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
        jobTitle: true,
        onlineSpecialty: true,
        teachingSubject: true,
        documentReg: true,
        consultationFee: true,
        sessionDuration: true,
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
        const publicName =
          professional.displayName?.trim() || professional.name.trim();

        return {
          id: professional.id,
          name: publicName,
          bio: professional.bio,
          rating: professional.rating,
          jobTitle: professional.jobTitle,
          onlineSpecialty: professional.onlineSpecialty,
          teachingSubject: professional.teachingSubject,
          sessionDuration: professional.sessionDuration,
          consultationFee: Number(professional.consultationFee),
          hasProfileImage: professional.profileImageBytes !== null,
        };
      });

    return { data: validProfessionals };
  } catch (error) {
    console.error("Erro no Back-end:", error);
    return { error: "Falha ao buscar especialistas." };
  }
}
