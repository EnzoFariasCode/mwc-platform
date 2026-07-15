import { db } from "@/lib/prisma";
import { healthSpecialties } from "@/modules/health/lib/specialties";
import { eligibleHealthProfessionalWhere } from "@/modules/health/lib/health-professional-eligibility";

export async function getHealthSpecialtyCards() {
  const cards = await Promise.all(
    healthSpecialties.map(async (specialty) => {
      // Usamos db.user.count para saber exatamente quantos profissionais
      // atendem aos critérios sem precisar baixar os dados deles para a memória.
      const count = await db.user.count({
        where: {
          ...eligibleHealthProfessionalWhere,
          onlineSpecialty: specialty.code,
          jobTitle: { not: null },
        },
      });

      return {
        ...specialty,
        count: count,
      };
    }),
  );

  return cards;
}
