"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Tipagem atualizada para o Esquadrão
export type PatientProfileData = {
  id: string;
  name: string;
  displayName: string | null;
  email: string;
  birthDate: string | null;
  gender: string | null;
  phone: string | null;
  cep: string | null;
  address: string | null;
  addressNumber: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
};

export async function getCurrentPatientProfile() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Usuário não autenticado." };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      displayName: true,
      email: true,
      birthDate: true,
      gender: true,
      phone: true,
      cep: true,
      address: true,
      addressNumber: true,
      complement: true,
      neighborhood: true,
      city: true,
      state: true,
    },
  });

  if (!user) {
    return { error: "Usuário não encontrado." };
  }

  return {
    data: {
      ...user,
      birthDate: user.birthDate
        ? user.birthDate.toISOString().slice(0, 10)
        : null,
    },
  };
}

export async function updatePatientProfile(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Usuário não autenticado." };
  }

  // 1. [BACK-END] Extraindo TODA a carga do formulário
  const name = formData.get("name")?.toString().trim();
  const birthDate = formData.get("birthDate")?.toString();
  const gender = formData.get("gender")?.toString();
  const phone = formData.get("phone")?.toString().trim();
  const cep = formData.get("cep")?.toString().trim();
  const address = formData.get("address")?.toString().trim();
  const addressNumber = formData.get("addressNumber")?.toString().trim();
  const complement = formData.get("complement")?.toString().trim();
  const neighborhood = formData.get("neighborhood")?.toString().trim();
  const city = formData.get("city")?.toString().trim();
  const state = formData.get("state")?.toString().trim().toUpperCase();

  if (!name) {
    return { error: "Nome completo é obrigatório." };
  }

  try {
    // 2. [PRISMA] Persistindo todos os campos no banco
    await db.user.update({
      where: { id: session.user.id },
      data: {
        name,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender || null,
        phone: phone || null,
        cep: cep || null,
        address: address || null,
        addressNumber: addressNumber || null,
        complement: complement || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
      },
    });

    // 3. [DEVOPS] Limpando o cache para refletir as mudanças
    revalidatePath("/agendar-consulta/meu-perfil");
    revalidatePath("/agendar-consulta/historico");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil do paciente:", error);
    return { error: "Erro interno ao atualizar perfil." };
  }
}
