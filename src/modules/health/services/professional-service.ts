import { db } from "@/lib/prisma";

export async function getHealthProfessionalById(id: string) {
  return await db.user.findUnique({
    where: {
      id,
      industry: "HEALTH",
      userType: "PROFESSIONAL",
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      image: true,
      bio: true,
      jobTitle: true,
      documentReg: true,
      approach: true,
      consultationFee: true,
      rating: true,
      ratingCount: true,
      city: true,
      state: true,
    },
  });
}
