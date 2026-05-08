"use server";

import { db } from "@/lib/prisma";

export async function getProfessionalsBySpecialty(specialtyId: string) {
  try {
    const searchTerms: Record<string, string[]> = {
      psicologia: [
        "Psicologo",
        "Psicólogo",
        "Psicóloga",
        "Psicóloga(a)",
        "Psicólogo(a)",
        "Psicologia",
      ],
      advogado: ["Advogado", "Advogada", "Jurídico"],
      nutricao: ["Nutricionista", "Nutrição"],
      personal: ["Personal Trainer", "Personal"],
      ingles: [
        "Professor de Inglês",
        "Inglês",
        "English Teacher",
        "Professor de Ingles",
      ],
    };

    const terms = searchTerms[specialtyId.toLowerCase()] || [specialtyId];

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
              in: terms,
              mode: "insensitive",
            },
          },
          {
            approach: {
              contains: specialtyId,
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
        profileImageBytes: true, // ✅ corrigido: estava "rofileImageBytes"
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
          pro.availability !== null
        ) {
          hasValidAgenda = Object.keys(pro.availability).length > 0;
        }

        return hasValidDoc && hasValidJobTitle && hasValidAgenda;
      }) // ✅ corrigido: fechamento do .filter() no lugar certo
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
