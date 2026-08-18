"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { normalizePersonName } from "@/modules/users/lib/normalize-person-name";

const WHATSAPP_CONSENT_VERSION = "whatsapp-v1.0";

export type AccountProfileData = {
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
  whatsappConsent: boolean;
};

function formatPhoneNumber(value?: string | null) {
  const digits = value?.replace(/\D/g, "").slice(0, 11) ?? "";

  if (!digits) return null;
  if (digits.length !== 11) return "";

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export async function getCurrentAccountProfile() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Usu\u00e1rio n\u00e3o autenticado." };
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
      whatsappConsentEvents: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { granted: true },
      },
    },
  });

  if (!user) {
    return { error: "Usu\u00e1rio n\u00e3o encontrado." };
  }

  const { whatsappConsentEvents, ...profile } = user;

  return {
    data: {
      ...profile,
      whatsappConsent: whatsappConsentEvents[0]?.granted ?? false,
      birthDate: user.birthDate
        ? user.birthDate.toISOString().slice(0, 10)
        : null,
    },
  };
}

export async function updateAccountProfile(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Usu\u00e1rio n\u00e3o autenticado." };
  }

  // 1. [BACK-END] Extraindo TODA a carga do formulario
  const name = normalizePersonName(formData.get("name")?.toString());
  const birthDate = formData.get("birthDate")?.toString();
  const gender = formData.get("gender")?.toString();
  const phone = formatPhoneNumber(formData.get("phone")?.toString());
  const whatsappConsent = formData.get("whatsappConsent") === "on";
  const cep = formData.get("cep")?.toString().trim();
  const address = formData.get("address")?.toString().trim();
  const addressNumber = formData.get("addressNumber")?.toString().trim();
  const complement = formData.get("complement")?.toString().trim();
  const neighborhood = formData.get("neighborhood")?.toString().trim();
  const city = formData.get("city")?.toString().trim();
  const state = formData.get("state")?.toString().trim().toUpperCase();

  if (!name) {
    return { error: "Nome completo \u00e9 obrigat\u00f3rio." };
  }

  if (phone === "") {
    return {
      error:
        "Informe o telefone no padr\u00e3o (DDD) 99999-9999, com 11 d\u00edgitos.",
    };
  }

  if (whatsappConsent && !phone) {
    return {
      error: "Informe um telefone para autorizar notificacoes pelo WhatsApp.",
    };
  }

  try {
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || null;

    await db.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          phone: true,
          whatsappConsentEvents: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { granted: true, phone: true },
          },
        },
      });

      if (!current) {
        throw new Error("Usuario nao encontrado.");
      }

      await tx.user.update({
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

      const latestConsent = current.whatsappConsentEvents[0];
      const consentChanged = latestConsent?.granted !== whatsappConsent;
      const authorizedPhoneChanged =
        whatsappConsent && latestConsent?.phone !== phone;

      if (consentChanged || authorizedPhoneChanged) {
        await tx.whatsappConsentEvent.create({
          data: {
            userId: session.user.id,
            granted: whatsappConsent,
            phone: phone || current.phone,
            consentVersion: WHATSAPP_CONSENT_VERSION,
            ipAddress,
            userAgent,
          },
        });
      }
    });

    // 3. [DEVOPS] Limpando o cache para refletir as mudancas
    revalidatePath("/agendar-consulta/meu-perfil");
    revalidatePath("/agendar-consulta/historico");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil da conta:", error);
    return { error: "Erro interno ao atualizar perfil." };
  }
}
