"use server";

import { db } from "@/lib/prisma";
import { ActionResponse } from "@/modules/users/types/user-types";
import { Prisma, UserType } from "@prisma/client";

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
  jobTitle: string | null;
  hourlyRate: number | null;
  rating: number;
  ratingCount: number;
  skills: string[];
  portfolio: Prisma.JsonValue | null;
  certificates: Prisma.JsonValue | null;
  socialGithub: string | null;
  socialLinkedin: string | null;
  createdAt: Date;
  reviewsReceived: PublicReview[];
  avatarUrl: string | null;
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
        jobTitle: true,
        hourlyRate: true,
        rating: true,
        ratingCount: true,
        skills: true,
        portfolio: true,
        certificates: true,
        socialGithub: true,
        socialLinkedin: true,
        createdAt: true,
        // --- 🛡️ CAMPOS ADICIONADOS APENAS PARA A BARREIRA DE QUALIDADE ---
        industry: true,
        documentReg: true,
        availability: true,
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

    // --- 🛡️ BARREIRA DE QUALIDADE (QA & Back-end) ---
    if (professional.userType === "PROFESSIONAL") {
      const hasValidDoc =
        professional.documentReg && professional.documentReg.trim() !== "";
      const hasValidJobTitle =
        professional.jobTitle && professional.jobTitle.trim() !== "";
      const hasFee =
        professional.consultationFee !== null ||
        professional.hourlyRate !== null;

      let hasValidAgenda = false;
      if (typeof professional.availability === "string") {
        hasValidAgenda = professional.availability.length > 5;
      } else if (
        typeof professional.availability === "object" &&
        professional.availability !== null
      ) {
        hasValidAgenda = Object.keys(professional.availability).length > 0;
      }

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
      availability: _av,
      sessionDuration: _sd,
      consultationFee: _cf,
      industry: _ind,
      reviewsReceived: rawReviews, // Extraímos as avaliações com tipagem imperfeita
      ...rest
    } = professional;

    void _profileImageBytes;
    void _hourlyRate;
    void _doc;
    void _av;
    void _sd;
    void _cf;
    void _ind;

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
