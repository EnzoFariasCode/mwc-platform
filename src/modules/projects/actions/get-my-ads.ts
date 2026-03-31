"use server";

import { verifySession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { ProjectStatus } from "@prisma/client";
import { ActionResponse } from "@/modules/users/types/user-types";

export type MyAd = {
  id: string;
  title: string;
  description: string | null;
  budgetLabel: string;
  budgetValue: number;
  status: ProjectStatus;
  createdAt: string;
  proposalsCount: number;
};

export async function getMyOpenAds(): Promise<ActionResponse<MyAd[]>> {
  try {
    const session = await verifySession();
    const userId = session?.sub as string;

    if (!userId) return { success: false, error: "Nao autorizado." };

    const ads = await db.project.findMany({
      where: { ownerId: userId, status: ProjectStatus.OPEN },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        budgetLabel: true,
        budgetValue: true,
        status: true,
        createdAt: true,
        _count: { select: { proposals: true } },
      },
    });

    const data = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      budgetLabel: ad.budgetLabel,
      budgetValue: ad.budgetValue.toNumber(),
      status: ad.status,
      createdAt: ad.createdAt.toISOString(),
      proposalsCount: ad._count.proposals,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao buscar anuncios:", error);
    return { success: false, error: "Erro ao buscar anuncios." };
  }
}
