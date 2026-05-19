"use server";

import { db } from "@/lib/prisma";
import { getHealthSpecialtyById } from "@/modules/health/lib/specialties";

export async function getProfessionalsBySpecialty(specialtyId: string) {
  try {
    const specialty = getHealthSpecialtyById(specialtyId.toLowerCase());

    if (!specialty) {
      return { data: [] };
    }

    const professionals = await db.user.findMany({
      where: {
        userType: "PROFESSIONAL",
        industry: "HEALTH",
        documentReg: { not: null },
        jobTitle: { not: null },
        consultationFee: { not: null },
        sessionDuration: { not: null },
        OR: [
          {
            jobTitle: {
              in: specialty.terms,
              mode: "insensitive",
            },
          },
          {
            approach: {
              contains: specialty.id,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        bio: true,
        rating: true,
        ratingCount: true,
        jobTitle: true,
        documentReg: true,
        consultationFee: true,
        industry: true,
        image: true,
        availability: true,
        sessionDuration: true,
        approach: true,
        city: true,
        state: true,
        profileImageBytes: true,
      },
    });

    const validProfessionals = professionals
      .filter((pro) => {
        const hasValidDoc = pro.documentReg && pro.documentReg.trim() !== "";
        const hasValidJobTitle = pro.jobTitle && pro.jobTitle.trim() !== "";

        let hasValidAgenda = false;
        if (typeof pro.availability === "string") {
          hasValidAgenda = pro.availability.length > 5;
        } else if (
          typeof pro.availability === "object" &&
          pro.availability !== null &&
          !Array.isArray(pro.availability)
        ) {
          hasValidAgenda = Object.keys(pro.availability).length > 0;
        }

        return hasValidDoc && hasValidJobTitle && hasValidAgenda;
      })
      .map(({ profileImageBytes, ...pro }) => ({
        ...pro,
        hasProfileImage: profileImageBytes !== null,
      }));

    return { data: validProfessionals };
  } catch (error) {
    console.error("Erro no Back-end:", error);
    return { error: "Falha ao buscar especialistas." };
  }
}
