"use server"; // 🛡️ ISSO AQUI SALVA VIDAS! Garante que roda só no servidor.

import { db } from "@/lib/prisma";
import {
  eligibleHealthProfessionalWhere,
  hasValidProfessionalRegistration,
} from "@/modules/health/lib/health-professional-eligibility";

export async function getHealthProfessionalById(id: string) {
  try {
    const pro = await db.user.findUnique({
      where: {
        id,
        ...eligibleHealthProfessionalWhere,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        bio: true,
        jobTitle: true,
        documentReg: true,
        approach: true,
        consultationFee: true,
        sessionDuration: true,
        hourlyRate: true,
        rating: true,
        ratingCount: true,
        city: true,
        state: true,
        profileImageBytes: true,
        availabilities: {
          select: {
            dayOfWeek: true,
            isActive: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!pro || !hasValidProfessionalRegistration(pro.documentReg)) {
      return null;
    }

    // 🛡️ Sanitização para o Front-end não engasgar com datas e dinheiro (Decimals)
    return {
      id: pro.id,
      name: pro.name,
      displayName: pro.displayName,
      bio: pro.bio,
      jobTitle: pro.jobTitle,
      documentReg: pro.documentReg,
      approach: pro.approach,
      sessionDuration: pro.sessionDuration,
      rating: pro.rating,
      ratingCount: pro.ratingCount,
      city: pro.city,
      state: pro.state,
      availabilities: pro.availabilities,
      hasProfileImage: Boolean(pro.profileImageBytes),
      consultationFee: pro.consultationFee
        ? pro.consultationFee.toNumber()
        : 150,
      hourlyRate: pro.hourlyRate ? pro.hourlyRate.toNumber() : 0,
    };
  } catch (error) {
    console.error("Erro ao buscar profissional:", error);
    return null;
  }
}
