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
        // [NOVO] O banco já faz o filtro por nós! Só traz quem tem a agenda configurada e ativa.
        availabilities: {
          some: { isActive: true },
        },
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
        sessionDuration: true,
        approach: true,
        city: true,
        state: true,
        profileImageBytes: true,
      },
    });

    // Filtro JS muito mais leve, apenas para remover espaços em branco vazios
    const validProfessionals = professionals
      .filter((pro) => {
        const hasValidDoc = pro.documentReg && pro.documentReg.trim() !== "";
        const hasValidJobTitle = pro.jobTitle && pro.jobTitle.trim() !== "";

        return hasValidDoc && hasValidJobTitle;
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
