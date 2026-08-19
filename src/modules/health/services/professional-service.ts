"use server";

import { db } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/action-rate-limit";
import { getRateLimitKeys } from "@/lib/rate-limit";
import { getBookableHealthProfessionalWhere } from "@/modules/health/lib/health-professional-eligibility";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function publicReviewerName(name: string | null | undefined) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "Paciente MWC";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts.at(-1)?.charAt(0).toUpperCase()}.`;
}

export async function getHealthProfessionalById(id: string) {
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) return null;

  const keys = await getRateLimitKeys("health:public-professional");
  for (const key of keys) {
    const error = await consumeRateLimit({
      key,
      limit: 120,
      windowMs: 60_000,
      message: "Muitas consultas de perfil. Aguarde um minuto.",
    });
    if (error) throw new Error(error);
  }

  const professional = await db.user.findFirst({
    where: {
      ...getBookableHealthProfessionalWhere(),
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
      timezone: true,
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
        where: { isActive: true },
        select: {
          dayOfWeek: true,
          isActive: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  if (!professional) {
    return null;
  }

  return {
    id: professional.id,
    name:
      professional.displayName?.trim() ||
      professional.name.trim() ||
      "Profissional MWC",
    bio: professional.bio,
    jobTitle: professional.jobTitle,
    onlineSpecialty: professional.onlineSpecialty,
    teachingSubject: professional.teachingSubject,
    documentReg: professional.documentReg,
    approach: professional.approach,
    sessionDuration: professional.sessionDuration,
    rating: professional.rating,
    ratingCount: professional.ratingCount,
    city: professional.city,
    state: professional.state,
    hasProfileImage: Boolean(professional.profileImageBytes),
    reviews: professional.healthReviewsReceived.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      authorName: publicReviewerName(
        review.author.displayName || review.author.name,
      ),
    })),
    consultationFee: Number(professional.consultationFee),
  };
}
