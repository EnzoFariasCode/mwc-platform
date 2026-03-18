// src/services/user-service.ts
import { db } from "@/lib/prisma";
import { UserProfileDTO } from "@/modules/users/types/user-types";
import { Prisma } from "@prisma/client";

// ==========================================================
// 1. FUNÇÃO PARA O PERFIL (O erro está aqui, ela faltava)
// ==========================================================
export async function findProfileById(
  userId: string
): Promise<UserProfileDTO | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      displayName: true,
      email: true,
      userType: true,
    },
  });

  return user;
}

// ==========================================================
// 2. FUNÇÕES PARA AUTENTICAÇÃO (Login e Registro)
// ==========================================================
export async function findUserByEmail(email: string) {
  return await db.user.findUnique({
    where: { email },
  });
}

export async function createUser(data: Prisma.UserCreateInput) {
  return await db.user.create({
    data,
  });
}
