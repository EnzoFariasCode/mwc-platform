"use server"; // 🛡️ ISSO AQUI SALVA VIDAS! Garante que roda só no servidor.

import { db } from "@/lib/prisma";
import {
  getEligibleHealthProfessionalWhere,
  hasValidHealthProfessionalIdentity,
} from "@/modules/health/lib/health-professional-eligibility";

function publicReviewerName(name: string | null | undefined) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "Paciente MWC";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts.at(-1)?.charAt(0).toUpperCase()}.`;
}

export async function getHealthProfessionalById(id: string) {
  try {
    const pro = await db.user.findFirst({
      where: {
        ...getEligibleHealthProfessionalWhere(),
        id,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        bio: true,
        jobTitle: true,
        onlineSpecialty: true,
        teachingSubject: true,
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
        healthReviewsReceived: {
          where: { isVisible: true },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            author: {
              select: { name: true, displayName: true },
            },
          },
        },
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

    if (!pro || !hasValidHealthProfessionalIdentity(pro)) {
      return null;
    }

    // 🛡️ Sanitização para o Front-end não engasgar com datas e dinheiro (Decimals)
    return {
      id: pro.id,
      name: pro.name,
      displayName: pro.displayName,
      bio: pro.bio,
      jobTitle: pro.jobTitle,
      onlineSpecialty: pro.onlineSpecialty,
      teachingSubject: pro.teachingSubject,
      documentReg: pro.documentReg,
      approach: pro.approach,
      sessionDuration: pro.sessionDuration,
      rating: pro.rating,
      ratingCount: pro.ratingCount,
      city: pro.city,
      state: pro.state,
      availabilities: pro.availabilities,
      hasProfileImage: Boolean(pro.profileImageBytes),
      reviews: pro.healthReviewsReceived.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        authorName: publicReviewerName(
          review.author.displayName || review.author.name,
        ),
      })),
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
