"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

export async function getProfessionals({
  query,
  location,
  category,
  minPrice,
  maxPrice,
  sortBy = "relevancia",
  page = 1,
  limit = 10,
}: SearchFilters) {
  try {
    const where: Prisma.UserWhereInput = {
      userType: "PROFESSIONAL",

      ...(query && {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { bio: { contains: query, mode: "insensitive" } },
          { jobTitle: { contains: query, mode: "insensitive" } },
          { skills: { has: query } },
        ],
      }),

      ...(location && {
        OR: [
          { city: { contains: location, mode: "insensitive" } },
          { state: { contains: location, mode: "insensitive" } },
        ],
      }),

      ...((minPrice || maxPrice) && {
        hourlyRate: {
          gte: minPrice || 0,
          lte: maxPrice || 10000,
        },
      }),

      ...(category && {
        OR: [
          { jobTitle: { contains: category, mode: "insensitive" } },
          { skills: { has: category } },
        ],
      }),
    };

    let orderBy: Prisma.UserOrderByWithRelationInput = {};

    switch (sortBy) {
      case "menor_preco":
        orderBy = { hourlyRate: "asc" };
        break;
      case "avaliacao":
        orderBy = { rating: "desc" };
        break;
      case "experiencia":
        orderBy = { createdAt: "asc" };
        break;
      default:
        orderBy = { rating: "desc" };
    }

    const skip = (page - 1) * limit;

    const [professionals, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy,
        take: limit,
        skip,
        select: {
          id: true,
          name: true,
          bio: true,
          rating: true,
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

    return {
      success: true,
      data: professionals,
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    return { success: false, data: [], total: 0, totalPages: 0 };
  }
}
