"use server";

import { db } from "@/lib/prisma";
import { Prisma, UserType } from "@prisma/client"; // Importe o Enum do seu schema

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
    // 1. Construir o filtro (Where)
    const where: Prisma.UserWhereInput = {
      userType: "PROFESSIONAL", // <--- CORRIGIDO: userType ao invés de role

      // Filtro de Texto (Nome, Bio, Título do Cargo)
      ...(query && {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { bio: { contains: query, mode: "insensitive" } },
          { jobTitle: { contains: query, mode: "insensitive" } }, // <--- ADICIONADO: Busca pelo cargo
          // Busca exata nas skills (Postgres Array)
          { skills: { has: query } },
        ],
      }),

      // Filtro de Localização
      ...(location && {
        OR: [
          { city: { contains: location, mode: "insensitive" } },
          { state: { contains: location, mode: "insensitive" } },
        ],
      }),

      // Filtro de Preço (Hourly Rate)
      ...((minPrice || maxPrice) && {
        hourlyRate: {
          gte: minPrice || 0,
          lte: maxPrice || 10000,
        },
      }),

      // Filtro de Categoria (Se você usar 'jobTitle' ou uma skill específica como categoria)
      ...(category && {
        // Exemplo: Se categoria for "Programação", busca quem tem essa skill ou titulo
        OR: [
          { jobTitle: { contains: category, mode: "insensitive" } },
          { skills: { has: category } },
        ],
      }),
    };

    // 2. Definir a Ordenação (OrderBy)
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

    // 3. Buscar no Banco
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
          email: true,
          // image: true, // Se não tiver campo image no User, remova ou adicione no schema!
          bio: true,
          rating: true,
          hourlyRate: true,
          city: true,
          state: true,
          skills: true,
          jobTitle: true, // <--- ADICIONADO
          userType: true, // <--- CORRIGIDO
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
