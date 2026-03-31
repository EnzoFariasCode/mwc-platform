"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ActionResponse } from "@/modules/users/types/user-types";

interface SearchFilters {
  query?: string;
  location?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}

const MAX_LIMIT = 50;
const MAX_QUERY_LENGTH = 100;
const MAX_LOCATION_LENGTH = 100;
const MAX_CATEGORY_LENGTH = 100;

function normalizeText(value: string | undefined, maxLength: number) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

export async function getProfessionals({
  query,
  location,
  category,
  minPrice,
  maxPrice,
  sortBy = "relevancia",
  page = 1,
  limit = 10,
}: SearchFilters): Promise<
  ActionResponse<{
    professionals: any[];
    total: number;
    totalPages: number;
  }>
> {
  try {
    const safeQuery = normalizeText(query, MAX_QUERY_LENGTH);
    const safeLocation = normalizeText(location, MAX_LOCATION_LENGTH);
    const safeCategory = normalizeText(category, MAX_CATEGORY_LENGTH);

    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safeLimit = Number.isFinite(limit)
      ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)))
      : 10;

    let safeMinPrice = Number.isFinite(minPrice)
      ? Math.max(0, minPrice as number)
      : undefined;
    let safeMaxPrice = Number.isFinite(maxPrice)
      ? Math.max(0, maxPrice as number)
      : undefined;

    if (
      safeMinPrice !== undefined &&
      safeMaxPrice !== undefined &&
      safeMinPrice > safeMaxPrice
    ) {
      [safeMinPrice, safeMaxPrice] = [safeMaxPrice, safeMinPrice];
    }

    const allowedSorts = new Set([
      "relevancia",
      "menor_preco",
      "avaliacao",
      "experiencia",
    ]);
    const safeSortBy = allowedSorts.has(sortBy) ? sortBy : "relevancia";

    const where: Prisma.UserWhereInput = {
      userType: "PROFESSIONAL",

      ...(safeQuery && {
        OR: [
          { name: { contains: safeQuery, mode: "insensitive" } },
          { bio: { contains: safeQuery, mode: "insensitive" } },
          { jobTitle: { contains: safeQuery, mode: "insensitive" } },
          { skills: { has: safeQuery } },
        ],
      }),

      ...(safeLocation && {
        OR: [
          { city: { contains: safeLocation, mode: "insensitive" } },
          { state: { contains: safeLocation, mode: "insensitive" } },
        ],
      }),

      ...((safeMinPrice !== undefined || safeMaxPrice !== undefined) && {
        hourlyRate: {
          gte: safeMinPrice ?? 0,
          lte: safeMaxPrice ?? 10000,
        },
      }),

      ...(safeCategory && {
        OR: [
          { jobTitle: { contains: safeCategory, mode: "insensitive" } },
          { skills: { has: safeCategory } },
        ],
      }),
    };

    let orderBy:
      | Prisma.UserOrderByWithRelationInput
      | Prisma.UserOrderByWithRelationInput[] = {};

    switch (safeSortBy) {
      case "menor_preco":
        orderBy = { hourlyRate: "asc" };
        break;
      case "avaliacao":
        orderBy = [{ ratingCount: "desc" }, { rating: "desc" }];
        break;
      case "experiencia":
        orderBy = { createdAt: "asc" };
        break;
      default:
        orderBy = [{ ratingCount: "desc" }, { rating: "desc" }];
    }

    const skip = (safePage - 1) * safeLimit;

    const [professionals, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy,
        take: safeLimit,
        skip,
        select: {
          id: true,
          name: true,
          bio: true,
          rating: true,
          ratingCount: true,
          hourlyRate: true,
          city: true,
          state: true,
          skills: true,
          jobTitle: true,
          userType: true,
        },
      }),
      db.user.count({ where }),
    ]);

    const safeProfessionals = professionals.map((pro) => ({
      ...pro,
      hourlyRate: pro.hourlyRate ? pro.hourlyRate.toNumber() : null,
    }));

    return {
      success: true,
      data: {
        professionals: safeProfessionals,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    return {
      success: false,
      error: "Erro ao buscar profissionais.",
    };
  }
}
