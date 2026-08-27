"use server";

import { db } from "@/lib/prisma";
import { Prisma, UserType } from "@prisma/client";
import { ActionResponse } from "@/modules/users/types/user-types";
import {
  buildTechProfessionalOrderBy,
  type TechProfessionalSort,
} from "@/modules/subscriptions/tech-plan-ranking";
import { PROFESSIONAL_SEARCH_PAGE_SIZE } from "@/modules/search/lib/search-pagination";

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

type ProfessionalSummary = {
  id: string;
  name: string | null;
  bio: string | null;
  rating: number;
  ratingCount: number;
  hourlyRate: number | null;
  city: string | null;
  state: string | null;
  skills: string[];
  jobTitle: string | null;
  userType: UserType;
};

export async function getProfessionals({
  query,
  location,
  category,
  minPrice,
  maxPrice,
  sortBy = "relevancia",
  page = 1,
  limit = PROFESSIONAL_SEARCH_PAGE_SIZE,
}: SearchFilters): Promise<
  ActionResponse<{
    professionals: ProfessionalSummary[];
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
      : PROFESSIONAL_SEARCH_PAGE_SIZE;

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
      industry: "TECH",
      isActive: true,

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

    const orderBy = buildTechProfessionalOrderBy(
      safeSortBy as TechProfessionalSort,
    );

    const skip = (safePage - 1) * safeLimit;
    const activeSubscriptionStatuses = ["active", "trialing"];
    const advancedWhere: Prisma.UserWhereInput = {
      AND: [
        where,
        { professionalPlanTier: 2 },
        { stripeSubscriptionStatus: { in: activeSubscriptionStatuses } },
      ],
    };
    const starterWhere: Prisma.UserWhereInput = {
      AND: [
        where,
        { professionalPlanTier: 1 },
        { stripeSubscriptionStatus: { in: activeSubscriptionStatuses } },
      ],
    };
    const freeWhere: Prisma.UserWhereInput = {
      AND: [
        where,
        {
          NOT: {
            AND: [
              { professionalPlanTier: { in: [1, 2] } },
              {
                stripeSubscriptionStatus: {
                  in: activeSubscriptionStatuses,
                },
              },
            ],
          },
        },
      ],
    };
    const tierGroups = [advancedWhere, starterWhere, freeWhere];
    const tierOrderBy = orderBy.slice(1);
    const tierCounts = await Promise.all(
      tierGroups.map((tierWhere) => db.user.count({ where: tierWhere })),
    );
    const total = tierCounts.reduce((sum, count) => sum + count, 0);

    const professionalSelect = {
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
    } satisfies Prisma.UserSelect;
    type SelectedProfessional = Prisma.UserGetPayload<{
      select: typeof professionalSelect;
    }>;

    const professionals: SelectedProfessional[] = [];
    let remainingSkip = skip;
    let remainingTake = safeLimit;

    for (let index = 0; index < tierGroups.length; index += 1) {
      if (remainingTake === 0) break;
      const tierCount = tierCounts[index];

      if (remainingSkip >= tierCount) {
        remainingSkip -= tierCount;
        continue;
      }

      const tierProfessionals = await db.user.findMany({
        where: tierGroups[index],
        orderBy: tierOrderBy,
        skip: remainingSkip,
        take: remainingTake,
        select: professionalSelect,
      });
      professionals.push(...tierProfessionals);
      remainingTake -= tierProfessionals.length;
      remainingSkip = 0;
    }

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
