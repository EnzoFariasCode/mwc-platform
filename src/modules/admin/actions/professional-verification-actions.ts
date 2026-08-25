"use server";

import { addYears } from "date-fns";
import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { createAdminAuditLog } from "@/modules/admin/actions/audit-log";
import { enqueueAdminFinanceEmail } from "@/modules/email/services/admin-finance-email-service";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { validateProfessionalVerificationApproval } from "@/modules/health/lib/professional-verification-review";
import { isOnlineSpecialtyOperational } from "@/modules/health/lib/health-professional-eligibility";
import type { ProfessionalRegistryCheckResult } from "@prisma/client";

const decisions = ["APPROVE", "CHANGES_REQUIRED", "REJECT", "SUSPEND"] as const;
type Decision = (typeof decisions)[number];

function isDecision(value: string): value is Decision {
  return decisions.includes(value as Decision);
}

function textValue(formData: FormData, name: string) {
  return formData.get(name)?.toString().trim() || null;
}

function isRegistryResult(value: string): value is ProfessionalRegistryCheckResult {
  return ["ACTIVE", "INACTIVE", "NOT_FOUND", "INCONCLUSIVE", "NOT_APPLICABLE"].includes(value);
}

export async function startProfessionalVerificationReview(verificationId: string) {
  const admin = await requireAdminRole(["OWNER", "SUPPORT"]);

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.professionalVerification.updateMany({
      where: { id: verificationId, status: "PENDING" },
      data: {
        status: "UNDER_REVIEW",
        reviewerId: admin.id,
        reviewedAt: new Date(),
      },
    });

    if (updated.count !== 1) return false;

    await createAdminAuditLog(tx, {
      actorId: admin.id,
      action: "PROFESSIONAL_VERIFICATION_REVIEW_STARTED",
      entityType: "PROFESSIONAL_VERIFICATION",
      entityId: verificationId,
      reason: "Analise documental iniciada.",
    });
    return true;
  });

  revalidatePath(`/dashboard/admin/verificacoes/${verificationId}`);
  revalidatePath("/dashboard/admin/verificacoes");
  return result ? { success: true } : { error: "A verificacao nao esta mais pendente." };
}

export async function decideProfessionalVerification(formData: FormData) {
  const admin = await requireAdminRole(["OWNER", "SUPPORT"]);
  const verificationId = textValue(formData, "verificationId");
  const rawDecision = textValue(formData, "decision");
  const reason = textValue(formData, "reason");
  const sourceUrl = textValue(formData, "officialSourceUrl");
  const rawCheckResult = textValue(formData, "officialCheckResult");

  if (!verificationId || !rawDecision || !isDecision(rawDecision)) {
    return { error: "Decisao invalida." };
  }

  const verification = await db.professionalVerification.findUnique({
    where: { id: verificationId },
    include: {
      documents: { select: { type: true } },
      professional: {
        select: {
          id: true,
          name: true,
          displayName: true,
          email: true,
          onlineSpecialty: true,
        },
      },
    },
  });

  if (!verification || !verification.professional.onlineSpecialty) {
    return { error: "Verificacao nao encontrada." };
  }

  if (verification.specialty !== verification.professional.onlineSpecialty) {
    return { error: "A categoria do perfil mudou. Solicite um novo envio." };
  }

  const isApproval = rawDecision === "APPROVE";
  if (isApproval) {
    if (!rawCheckResult || !isRegistryResult(rawCheckResult)) {
      return { error: "Registre o resultado da verificacao oficial." };
    }
    const approvalError = validateProfessionalVerificationApproval({
      specialty: verification.specialty,
      council: verification.council,
      registrationNumber: verification.registrationNumber,
      registrationRegion: verification.registrationRegion,
      qualificationTitle: verification.qualificationTitle,
      documentTypes: verification.documents.map((document) => document.type),
      checkResult: rawCheckResult,
      sourceUrl,
    });
    if (approvalError) return { error: approvalError };
  } else if (!reason || reason.length < 10) {
    return { error: "Informe uma justificativa com pelo menos 10 caracteres." };
  }

  const nextStatus = {
    APPROVE: "APPROVED",
    CHANGES_REQUIRED: "CHANGES_REQUIRED",
    REJECT: "REJECTED",
    SUSPEND: "SUSPENDED",
  } as const;
  const action = {
    APPROVE: "PROFESSIONAL_VERIFICATION_APPROVED",
    CHANGES_REQUIRED: "PROFESSIONAL_VERIFICATION_CHANGES_REQUIRED",
    REJECT: "PROFESSIONAL_VERIFICATION_REJECTED",
    SUSPEND: "PROFESSIONAL_VERIFICATION_SUSPENDED",
  } as const;
  const now = new Date();
  const operationalOnApproval = isOnlineSpecialtyOperational(
    verification.specialty,
  );
  const approvalMessage = operationalOnApproval
    ? "Sua verificacao foi aprovada e seu perfil esta liberado para novos atendimentos."
    : "Sua verificacao foi aprovada. A categoria permanece temporariamente indisponivel para novos atendimentos.";
  const allowedStatuses =
    rawDecision === "SUSPEND"
      ? (["APPROVED"] as const)
      : (["PENDING", "UNDER_REVIEW"] as const);

  const changed = await db.$transaction(async (tx) => {
    const updated = await tx.professionalVerification.updateMany({
      where: { id: verification.id, status: { in: [...allowedStatuses] } },
      data: {
        status: nextStatus[rawDecision],
        reviewerId: admin.id,
        reviewedAt: now,
        reviewReason: reason,
        decisionNotifiedAt: null,
        decisionEmailError: null,
        officialSourceUrl:
          rawDecision === "SUSPEND"
            ? verification.officialSourceUrl
            : sourceUrl,
        officialCheckResult:
          rawDecision === "SUSPEND"
            ? verification.officialCheckResult
            : rawCheckResult && isRegistryResult(rawCheckResult)
              ? rawCheckResult
              : null,
        officialCheckedAt:
          rawDecision === "SUSPEND"
            ? verification.officialCheckedAt
            : rawCheckResult
              ? now
              : null,
        verifiedAt: isApproval ? now : verification.verifiedAt,
        expiresAt: isApproval ? addYears(now, 1) : verification.expiresAt,
      },
    });

    if (updated.count !== 1) return false;

    await createAdminAuditLog(tx, {
      actorId: admin.id,
      action: action[rawDecision],
      entityType: "PROFESSIONAL_VERIFICATION",
      entityId: verification.id,
      reason: reason || "Documentos e registro profissional aprovados.",
      metadata: {
        professionalId: verification.professional.id,
        specialty: verification.specialty,
        council: verification.council,
        checkResult: rawCheckResult,
        sourceUrl,
        nextStatus: nextStatus[rawDecision],
      },
    });

    await upsertNotification(
      {
        userId: verification.professional.id,
        actorId: admin.id,
        type: isApproval ? "SUCCESS" : "WARNING",
        eventType: `PROFESSIONAL_VERIFICATION_${nextStatus[rawDecision]}`,
        title: isApproval ? "Perfil profissional verificado" : "Atualizacao da verificacao profissional",
        message: isApproval
          ? approvalMessage
          : reason!,
        link: "/agendar-consulta/verificacao",
        entityType: "PROFESSIONAL_VERIFICATION",
        entityId: verification.id,
      },
      tx,
    );
    await enqueueAdminFinanceEmail(tx, {
      idempotencyKey: `ADMIN_VERIFICATION_DECISION:${verification.id}:${nextStatus[rawDecision]}:${verification.professional.id}`,
      eventType: `ADMIN_VERIFICATION_DECISION_${nextStatus[rawDecision]}`,
      templateKey: "admin.verification.decision",
      recipient: verification.professional,
      entityType: "PROFESSIONAL_VERIFICATION",
      entityId: verification.id,
      content: {
        title: isApproval
          ? "Verificacao profissional aprovada"
          : "Atualizacao da verificacao profissional",
        preview: isApproval
          ? approvalMessage
          : "Sua verificacao profissional recebeu uma decisao administrativa.",
        lines: isApproval
          ? [approvalMessage]
          : [
              `Status da analise: ${nextStatus[rawDecision]}.`,
              `Justificativa: ${reason}`,
            ],
        details: [
          { label: "Categoria", value: verification.specialty },
          { label: "Status", value: nextStatus[rawDecision] },
        ],
        actionLabel: "Abrir verificacao",
        actionPath: "/agendar-consulta/verificacao",
      },
    });
    return true;
  });

  if (!changed) {
    return { error: "A verificacao foi alterada por outra operacao. Atualize a pagina." };
  }

  revalidatePath(`/dashboard/admin/verificacoes/${verification.id}`);
  revalidatePath("/dashboard/admin/verificacoes");
  revalidatePath("/agendar-consulta/dashboard-profissional");
  revalidatePath(`/agendar-consulta/perfil/${verification.professional.id}`);

  return { success: true, emailQueued: true };
}

export async function retryProfessionalVerificationDecisionEmail(
  verificationId: string,
) {
  const admin = await requireAdminRole(["OWNER", "SUPPORT"]);

  if (!verificationId) return { error: "Verificacao invalida." };

  const verification = await db.professionalVerification.findUnique({
    where: { id: verificationId },
    select: {
      id: true,
      status: true,
      specialty: true,
      reviewReason: true,
      professional: {
        select: { id: true, email: true, name: true, displayName: true },
      },
    },
  });

  if (
    !verification ||
    !["APPROVED", "CHANGES_REQUIRED", "REJECTED", "SUSPENDED"].includes(
      verification.status,
    )
  ) {
    return { error: "A verificacao ainda nao possui uma decisao comunicavel." };
  }

  const isApproval = verification.status === "APPROVED";
  const operationalOnApproval = isOnlineSpecialtyOperational(
    verification.specialty,
  );
  const approvalMessage = operationalOnApproval
    ? "Sua verificacao foi aprovada e seu perfil esta liberado para novos atendimentos."
    : "Sua verificacao foi aprovada. A categoria permanece temporariamente indisponivel para novos atendimentos.";
  const attemptedAt = new Date();

  await db.$transaction(async (tx) => {
    const retryAudit = await createAdminAuditLog(tx, {
      actorId: admin.id,
      action: "PROFESSIONAL_VERIFICATION_EMAIL_RETRY",
      entityType: "PROFESSIONAL_VERIFICATION",
      entityId: verification.id,
      reason: "Reenvio da comunicacao registrado na outbox.",
      metadata: {
        emailQueued: true,
        attemptedAt: attemptedAt.toISOString(),
      },
    });
    await enqueueAdminFinanceEmail(tx, {
      idempotencyKey: `ADMIN_VERIFICATION_DECISION_RETRY:${retryAudit.id}:${verification.professional.id}`,
      eventType: "ADMIN_VERIFICATION_DECISION_RETRY",
      templateKey: "admin.verification.decision",
      recipient: verification.professional,
      entityType: "PROFESSIONAL_VERIFICATION",
      entityId: verification.id,
      content: {
        title: isApproval
          ? "Verificacao profissional aprovada"
          : "Atualizacao da verificacao profissional",
        preview: isApproval
          ? approvalMessage
          : "Sua verificacao profissional recebeu uma decisao administrativa.",
        lines: isApproval
          ? [approvalMessage]
          : [
              `Status da analise: ${verification.status}.`,
              `Justificativa: ${verification.reviewReason || "Consulte o painel."}`,
            ],
        details: [
          { label: "Categoria", value: verification.specialty },
          { label: "Status", value: verification.status },
        ],
        actionLabel: "Abrir verificacao",
        actionPath: "/agendar-consulta/verificacao",
      },
    });
  });

  revalidatePath(`/dashboard/admin/verificacoes/${verification.id}`);

  return { success: true, emailQueued: true };
}
