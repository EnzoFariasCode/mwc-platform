import { db } from "@/lib/prisma";
import { healthSpecialties } from "@/modules/health/lib/specialties";

function hasConfiguredAvailability(availability: unknown) {
  if (!availability) return false;

  if (typeof availability === "string") {
    return availability.length > 5;
  }

  if (typeof availability === "object" && !Array.isArray(availability)) {
    return Object.keys(availability).length > 0;
  }

  return false;
}

export async function getHealthSpecialtyCards() {
  const cards = await Promise.all(
    healthSpecialties.map(async (specialty) => {
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
          availability: true,
        },
      });

      const availableCount = professionals.filter((pro) =>
        hasConfiguredAvailability(pro.availability),
      ).length;

      return {
        ...specialty,
        count: availableCount,
      };
    }),
  );

  return cards;
}
