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
        // --- 🛡️ BARREIRA DE QUALIDADE 1 (Back-end) ---
        // O banco de dados só retorna quem tem dados escalares não nulos
        documentReg: { not: null },
        jobTitle: { not: null },
        consultationFee: { not: null },
        sessionDuration: { not: null },
        // A trava da availability (JSON) foi movida 100% para a Barreira 2
        // ----------------------------------------------
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
      },
    });

    // --- 🛡️ BARREIRA DE QUALIDADE 2 (QA) ---
    // Garante que o usuário não burlou a validação salvando apenas espaços em branco (" ") ou agenda vazia
    const validProfessionals = professionals.filter((pro) => {
      const hasValidDoc = pro.documentReg && pro.documentReg.trim() !== "";
      const hasValidJobTitle = pro.jobTitle && pro.jobTitle.trim() !== "";

      // Verifica se a agenda (JSON/Object ou String) não está vazia
      let hasValidAgenda = false;
      if (typeof pro.availability === "string") {
        hasValidAgenda = pro.availability.length > 5; // Mínimo para ser um JSON válido com conteúdo
      } else if (
        typeof pro.availability === "object" &&
        pro.availability !== null
      ) {
        // Checa se o objeto JSON não é apenas um "{}" vazio
        hasValidAgenda = Object.keys(pro.availability).length > 0;
      }

      return hasValidDoc && hasValidJobTitle && hasValidAgenda;
    });

    return { data: validProfessionals };
  } catch (error) {
    console.error("Erro no Back-end:", error);
    return { error: "Falha ao buscar especialistas." };
  }
}
