"use server";

import { db } from "@/lib/prisma";

export async function getProfessionalsBySpecialty(specialtyId: string) {
  try {
    // [QA] Mapeamento para garantir que termos diferentes encontrem o mesmo cargo
    const searchTerms: Record<string, string[]> = {
      psicologia: ["Psicologo", "Psicólogo", "Psicóloga", "Psicologia"],
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
        jobTitle: true, // Campo real
        documentReg: true, // Campo real
        consultationFee: true, // Campo real[cite: 1]
        industry: true,
        image: true,
        availability: true,
        sessionDuration: true,
        approach: true,
        city: true,
        state: true,
      },
    });

    return { data: professionals };
  } catch (error) {
    console.error("Erro no Back-end:", error);
    return { error: "Falha ao buscar especialistas." };
  }
}
