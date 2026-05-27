import { db } from "@/lib/prisma";
import { healthSpecialties } from "@/modules/health/lib/specialties";

export async function getHealthSpecialtyCards() {
  const cards = await Promise.all(
    healthSpecialties.map(async (specialty) => {
      // Usamos db.user.count para saber exatamente quantos profissionais
      // atendem aos critérios sem precisar baixar os dados deles para a memória.
      const count = await db.user.count({
        where: {
          userType: "PROFESSIONAL",
          industry: "HEALTH",
          // Filtros de integridade do perfil
          documentReg: { not: null },
          jobTitle: { not: null },
          consultationFee: { not: null },
          sessionDuration: { not: null },

          // O "coração" da nova lógica:
          // Só conta quem tem disponibilidade configurada na tabela nova
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
                contains: specialty.id, // Assume que specialty.id é o termo da abordagem
                mode: "insensitive",
              },
            },
          ],
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
