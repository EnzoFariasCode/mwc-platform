"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { enqueueAdminNotificationEmails } from "@/modules/email/services/admin-finance-email-service";
import {
  expectedCouncilForSpecialty,
  officialRegistryUrl,
  PROFESSIONAL_VERIFICATION_PRIVACY_VERSION,
  requiredVerificationDocuments,
} from "@/modules/health/lib/professional-verification-policy";
import { revalidatePath } from "next/cache";

function textValue(formData: FormData, name: string) {
  return formData.get(name)?.toString().trim() || null;
}

export async function submitProfessionalVerification(formData: FormData) {
  const session = await auth();

  if (
    !session?.user?.id ||
    session.user.userType !== "PROFESSIONAL" ||
    session.user.industry !== "HEALTH"
  ) {
    return { error: "Acesso permitido apenas ao profissional MWC Online." };
  }

  if (formData.get("privacyAccepted") !== "true") {
    return { error: "Confirme o tratamento dos documentos para enviar." };
  }

  const professional = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      onlineSpecialty: true,
      teachingSubject: true,
      professionalVerification: {
        include: { documents: { select: { type: true } } },
      },
    },
  });

  if (!professional?.onlineSpecialty) {
    return { error: "Defina sua categoria profissional antes de enviar." };
  }

  const verification = professional.professionalVerification;
  if (!verification) {
    return { error: "Envie os documentos obrigatorios antes de continuar." };
  }

  if (
    !["DRAFT", "CHANGES_REQUIRED", "REJECTED", "EXPIRED"].includes(
      verification.status,
    )
  ) {
    return { error: "Esta verificacao nao pode ser alterada agora." };
  }

  if (verification.specialty !== professional.onlineSpecialty) {
    return {
      error: "A categoria mudou. Reenvie os documentos correspondentes.",
    };
  }

  const requiredDocuments = requiredVerificationDocuments(
    professional.onlineSpecialty,
  );
  const uploadedTypes = new Set(
    verification.documents.map((document) => document.type),
  );
  const missingDocument = requiredDocuments.find(
    (type) => !uploadedTypes.has(type),
  );

  if (missingDocument) {
    return { error: "Envie todos os documentos obrigatorios." };
  }

  const isTeacher = professional.onlineSpecialty === "TEACHER";
  const registrationNumber = textValue(formData, "registrationNumber");
  const registrationRegion = textValue(formData, "registrationRegion")
    ?.toUpperCase()
    .slice(0, 12) ?? null;
  const qualificationTitle = textValue(formData, "qualificationTitle");

  if (isTeacher) {
    if (!professional.teachingSubject?.trim() || !qualificationTitle) {
      return {
        error: "Informe sua materia e a formacao ou certificacao apresentada.",
      };
    }
  } else if (
    !registrationNumber ||
    registrationNumber.length < 3 ||
    !registrationRegion ||
    registrationRegion.length < 2
  ) {
    return { error: "Informe numero e regiao do registro profissional." };
  }

  const council = expectedCouncilForSpecialty(professional.onlineSpecialty);
  const submittedAt = new Date();

  await db.$transaction(async (tx) => {
    await tx.professionalVerification.update({
      where: { id: verification.id },
      data: {
        specialty: professional.onlineSpecialty!,
        council,
        registrationNumber: isTeacher ? null : registrationNumber,
        registrationRegion: isTeacher ? null : registrationRegion,
        qualificationTitle: isTeacher ? qualificationTitle : null,
        officialSourceUrl: officialRegistryUrl(professional.onlineSpecialty!),
        officialCheckResult: null,
        officialCheckedAt: null,
        status: "PENDING",
        submittedAt,
        reviewedAt: null,
        reviewerId: null,
        reviewReason: null,
        verifiedAt: null,
        expiresAt: null,
        privacyAcceptedAt: submittedAt,
        privacyTermsVersion: PROFESSIONAL_VERIFICATION_PRIVACY_VERSION,
      },
    });

    if (!isTeacher) {
      await tx.user.update({
        where: { id: professional.id },
        data: {
          documentReg: `${council} ${registrationRegion}/${registrationNumber}`,
        },
      });
    }

    await enqueueAdminNotificationEmails(tx, {
      eventType: "PROFESSIONAL_VERIFICATION_SUBMITTED",
      entityType: "PROFESSIONAL_VERIFICATION",
      entityId: verification.id,
      templateKey: "admin.verification.submitted",
      roles: ["OWNER", "SUPPORT"],
      title: "Nova verificacao profissional",
      summary: `${professional.name} enviou documentos para analise.`,
      lines: [
        "Um profissional da MWC Online concluiu o envio documental.",
        "Analise os documentos exclusivamente pelo painel administrativo.",
      ],
      details: [
        { label: "Profissional", value: professional.name },
        { label: "Categoria", value: professional.onlineSpecialty! },
      ],
      actionPath: `/dashboard/admin/verificacoes/${verification.id}`,
      actionLabel: "Analisar documentos",
      actorId: professional.id,
      notification: {
        type: "INFO",
        title: "Nova verificacao profissional",
        message: `${professional.name} enviou documentos para analise.`,
      },
    });
  });

  revalidatePath("/agendar-consulta/verificacao");
  revalidatePath("/agendar-consulta/dashboard-profissional");
  revalidatePath("/dashboard/admin/verificacoes");

  return { success: true };
}
