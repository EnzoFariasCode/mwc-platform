"use server";

import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";
import { Industry, Prisma, UserType } from "@prisma/client";
import {
  getBookableHealthProfessionalWhere,
  getHealthProfessionalBookingReadinessError,
} from "@/modules/health/lib/health-professional-eligibility";

type PublicReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  author: { name: string };
};

type PublicProfile = {
  id: string;
  name: string | null;
  displayName: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  userType: UserType;
  industry: Industry;
  jobTitle: string | null;
  hourlyRate: number | null;
  rating: number;
  ratingCount: number;
  skills: string[];
  portfolio: Prisma.JsonValue | null;
  certificates: Prisma.JsonValue | null;
  socialGithub: string | null;
  socialLinkedin: string | null;
  stripeSubscriptionStatus: string | null;
  professionalPlanTier: number | null;
  createdAt: Date;
  reviewsReceived: PublicReview[];
  avatarUrl: string | null;
  isActive: boolean;
};

export async function getPublicProfile(
  userId: string,
): Promise<ActionResponse<PublicProfile>> {
  try {
    const professional = await db.user.findFirst({
      where: {
        id: userId,
        userType: "PROFESSIONAL",
        isActive: true,
        OR: [
          { industry: { not: "HEALTH" } },
          getBookableHealthProfessionalWhere(),
        ],
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        profileImageBytes: true,
        image: true,
        bio: true,
        approach: true,
        birthDate: true,
        phone: true,
        city: true,
        state: true,
        userType: true,
        isActive: true,
        jobTitle: true,
        hourlyRate: true,
        rating: true,
        ratingCount: true,
        skills: true,
        portfolio: true,
        certificates: true,
        socialGithub: true,
        socialLinkedin: true,
        stripeSubscriptionStatus: true,
        professionalPlanTier: true,
        createdAt: true,
        // --- 🛡️ CAMPOS ADICIONADOS APENAS PARA A BARREIRA DE QUALIDADE ---
        industry: true,
        onlineSpecialty: true,
        teachingSubject: true,
        documentReg: true,
        availabilities: {
          where: { isActive: true },
        },
        sessionDuration: true,
        consultationFee: true,
        timezone: true,
        professionalVerification: {
          select: { specialty: true, status: true, expiresAt: true },
        },
        // -------------------------------------------------------------------
        reviewsReceived: {
          where: {
            comment: { not: null },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            author: { select: { name: true } },
          },
        },
      },
    });

    if (!professional) {
      return { success: false, error: "Perfil não encontrado." };
    }

    if (professional.industry === "HEALTH") {
      if (getHealthProfessionalBookingReadinessError(professional)) {
        return {
          success: false,
          error: "Este perfil está indisponível no momento.",
        };
      }
    }
    // ------------------------------------------------

    // --- LÓGICA DE TRANSFORMAÇÃO DA IMAGEM ---
    const avatarUrl = professional.profileImageBytes
      ? `/api/images/user/${professional.id}`
      : null;

    const hourlyRate = professional.hourlyRate
      ? professional.hourlyRate.toNumber()
      : null;

    // Removemos os campos de validação da resposta e extraímos o rawReviews
    const {
      profileImageBytes: _profileImageBytes,
      image: _image,
      approach: _approach,
      birthDate: _birthDate,
      phone: _phone,
      hourlyRate: _hourlyRate,
      documentReg: _doc,
      onlineSpecialty: _onlineSpecialty,
      teachingSubject: _teachingSubject,
      availabilities: _av,
      sessionDuration: _sd,
      consultationFee: _cf,
      timezone: _timezone,
      professionalVerification: _professionalVerification,
      reviewsReceived: rawReviews, // Extraímos as avaliações com tipagem imperfeita
      ...rest
    } = professional;

    void _profileImageBytes;
    void _image;
    void _approach;
    void _birthDate;
    void _phone;
    void _hourlyRate;
    void _doc;
    void _onlineSpecialty;
    void _teachingSubject;
    void _av;
    void _sd;
    void _cf;
    void _timezone;
    void _professionalVerification;

    // --- 🛠️ CORREÇÃO DE TIPAGEM PARA O TYPESCRIPT ---
    // Mapeamos o array e garantimos ao TS que o comment é string (já filtramos no banco)
    const formattedReviews: PublicReview[] = rawReviews.map((review) => ({
      ...review,
      comment: review.comment as string,
    }));

    return {
      success: true,
      data: {
        ...rest,
        hourlyRate,
        avatarUrl,
        reviewsReceived: formattedReviews, // Passamos a lista corrigida e tipada
      },
    };
  } catch (error) {
    console.error("Erro ao buscar perfil público:", error);
    return { success: false, error: "Erro ao buscar perfil." };
  }
}
