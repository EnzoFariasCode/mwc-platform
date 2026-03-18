"use server";

import { db } from "@/lib/prisma";

export async function getPublicProfile(userId: string) {
  try {
    const professional = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        displayName: true,
        // --- ADICIONADO: Selecionamos os bytes para saber se tem foto ---
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

    if (!professional) return null;

    // --- LÓGICA DE TRANSFORMAÇÃO DA IMAGEM ---
    // Se o campo de bytes não for nulo, criamos a URL para a API de imagens.
    // Caso contrário, enviamos null (o frontend mostrará a inicial do nome).
    const avatarUrl = professional.profileImageBytes
      ? `/api/images/user/${professional.id}`
      : null;

    // Removemos os dados binários pesados (profileImageBytes) do objeto
    // antes de enviá-lo para o navegador, mantendo o resto.
    const { profileImageBytes: _profileImageBytes, ...rest } = professional;
    void _profileImageBytes;

    return {
      ...rest,
      avatarUrl, // O frontend usará este campo
    };
  } catch (error) {
    console.error("Erro ao buscar perfil público:", error);
    return null;
  }
}
