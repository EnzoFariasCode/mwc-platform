"use server"; // 🛡️ ISSO AQUI SALVA VIDAS! Garante que roda só no servidor.

import { db } from "@/lib/prisma";

export async function getHealthProfessionalById(id: string) {
  try {
    const pro = await db.user.findUnique({
      where: {
        id,
        industry: "HEALTH",
      },
      // Pode adicionar os selects que quiser aqui, ou deixar trazer tudo
    });

    if (!pro) return null;

    // 🛡️ Sanitização para o Front-end não engasgar com datas e dinheiro (Decimals)
    return {
      ...pro,
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
