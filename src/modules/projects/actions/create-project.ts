"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/modules/users/types/user-types";
import { verifySession } from "@/lib/auth"; // <--- Importante: Importar a função de segurança

interface CreateProjectData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  budgetType: "fixed" | "hourly";
  budgetValue: number;
  deadline: string;
  attachments: string[];
}

const PROJECT_TITLE_MIN = 8;
const PROJECT_TITLE_MAX = 120;
const PROJECT_DESCRIPTION_MIN = 30;
const PROJECT_DESCRIPTION_MAX = 5000;
const PROJECT_FIELD_MAX = 80;
const PROJECT_TAG_MAX = 30;
const PROJECT_TAG_LIMIT = 8;
const PROJECT_ATTACHMENT_LIMIT = 5;
const PROJECT_ATTACHMENT_MAX = 500;
const PROJECT_BUDGET_MIN = 10;
const PROJECT_BUDGET_MAX = 1_000_000;

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeLongText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringList(
  values: unknown,
  limit: number,
  maxLength: number,
) {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .slice(0, limit)
    .map((value) => value.slice(0, maxLength));
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function createProject(
  data: CreateProjectData
): Promise<ActionResponse> {
  try {
    // --- LÓGICA NOVA DE AUTH (NEXTAUTH) ---
    const session = await verifySession();
    const userId = session?.sub as string; // Extrai o ID do token assinado

    if (!userId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    if (session?.userType === "ADMIN") {
      return {
        success: false,
        error: "Contas administrativas nao podem publicar projetos.",
      };
    }
    // ---------------------------------

    const title = normalizeText(data.title);
    const description = normalizeLongText(data.description);
    const category = normalizeText(data.category);
    const deadline = normalizeText(data.deadline);
    const budgetType = data.budgetType === "hourly" ? "hourly" : "fixed";
    const budgetValue = Number(data.budgetValue);
    const tags = normalizeStringList(
      data.tags,
      PROJECT_TAG_LIMIT,
      PROJECT_TAG_MAX,
    );
    const attachments = normalizeStringList(
      data.attachments,
      PROJECT_ATTACHMENT_LIMIT,
      PROJECT_ATTACHMENT_MAX,
    );

    if (title.length < PROJECT_TITLE_MIN || title.length > PROJECT_TITLE_MAX) {
      return { success: false, error: "Informe um titulo valido." };
    }

    if (
      description.length < PROJECT_DESCRIPTION_MIN ||
      description.length > PROJECT_DESCRIPTION_MAX
    ) {
      return { success: false, error: "Informe uma descricao valida." };
    }

    if (!category || category.length > PROJECT_FIELD_MAX) {
      return { success: false, error: "Informe uma categoria valida." };
    }

    if (!deadline || deadline.length > PROJECT_FIELD_MAX) {
      return { success: false, error: "Informe um prazo valido." };
    }

    if (
      !Number.isFinite(budgetValue) ||
      budgetValue < PROJECT_BUDGET_MIN ||
      budgetValue > PROJECT_BUDGET_MAX
    ) {
      return { success: false, error: "Informe um orcamento valido." };
    }

    if (attachments.some((attachment) => !isHttpUrl(attachment))) {
      return { success: false, error: "Informe links de anexo validos." };
    }

    const prefix = "R$ ";
    const suffix = budgetType === "hourly" ? "/h" : "";
    const budgetLabel = `${prefix}${budgetValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}${suffix}`;

    await db.project.create({
      data: {
        title,
        description,
        category,
        tags,
        budgetType,
        budgetValue: new Prisma.Decimal(budgetValue.toFixed(2)),
        budgetLabel: budgetLabel,
        deadline,
        ownerId: userId, // Usa o ID seguro
        status: "OPEN",
        attachments,
      },
    });

    revalidatePath("/dashboard/cliente");
    revalidatePath("/dashboard/encontrar-projetos");
    // Revalida também a página de "Meus Projetos" para aparecer na lista imediatamente
    revalidatePath("/dashboard/meus-projetos");

    return { success: true };
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    return { success: false, error: "Erro ao publicar projeto." };
  }
}
