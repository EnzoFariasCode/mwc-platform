"use server";

import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";
import { Industry, Prisma, UserType } from "@prisma/client";

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
    const professional = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        displayName: true,
        profileImageBytes: true,
        bio: true,
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
        documentReg: true,
        availabilities: {
          where: { isActive: true },
        },
        sessionDuration: true,
        consultationFee: true,
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

    if (professional.userType !== "PROFESSIONAL" || !professional.isActive) {
      return {
        success: false,
        error: "Este perfil está indisponível no momento.",
      };
    }

    // --- 🛡️ BARREIRA DE QUALIDADE (QA & Back-end) ---
    if (professional.industry === "HEALTH") {
      const hasValidDoc =
        professional.documentReg && professional.documentReg.trim() !== "";
      const hasValidJobTitle =
        professional.jobTitle && professional.jobTitle.trim() !== "";
      const hasFee = professional.consultationFee !== null;

      const hasValidAgenda =
        Array.isArray(professional.availabilities) &&
        professional.availabilities.length > 0;

      if (!hasValidDoc || !hasValidJobTitle || !hasValidAgenda || !hasFee) {
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
      hourlyRate: _hourlyRate,
      documentReg: _doc,
      availabilities: _av,
      sessionDuration: _sd,
      consultationFee: _cf,
      reviewsReceived: rawReviews, // Extraímos as avaliações com tipagem imperfeita
      ...rest
    } = professional;

    void _profileImageBytes;
    void _hourlyRate;
    void _doc;
    void _av;
    void _sd;
    void _cf;

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
