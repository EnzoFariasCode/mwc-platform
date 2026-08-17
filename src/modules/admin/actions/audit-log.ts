"use server";

import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/get-session";
import {
  allowedAdminRolesForAuditEntity,
  type AdminAuditEntityType,
} from "@/modules/admin/lib/admin-permissions";

export type { AdminAuditEntityType } from "@/modules/admin/lib/admin-permissions";

type AuditClient = Pick<typeof db, "$executeRaw">;

export type AdminAuditAction =
  | "TECH_DISPUTE_REFUND_CLIENT"
  | "TECH_DISPUTE_RELEASE_PROFESSIONAL"
  | "HEALTH_DISPUTE_REFUND_PATIENT"
  | "HEALTH_DISPUTE_RELEASE_PROFESSIONAL"
  | "PIX_WITHDRAWAL_MARK_COMPLETED"
  | "WITHDRAWAL_PROCESSING_STARTED"
  | "PIX_WITHDRAWAL_REJECTED"
  | "PIX_WITHDRAWAL_CANCELED"
  | "PIX_WITHDRAWAL_RECEIPT_ATTACHED"
  | "USER_ACCOUNT_SUSPENDED"
  | "USER_ACCOUNT_REACTIVATED"
  | "ADMIN_ROLE_UPDATED"
  | "HEALTH_CANCELLATION_RETRY"
  | "HEALTH_CANCELLATION_MEET_RESOLVED"
  | "HEALTH_CANCELLATION_REFUND_ATTACHED"
  | "HEALTH_RESCHEDULE_RETRY"
  | "HEALTH_MEETING_ADMIN_RETRY"
  | "HEALTH_MEETING_MANUAL_LINK"
  | "PROFESSIONAL_VERIFICATION_REVIEW_STARTED"
  | "PROFESSIONAL_VERIFICATION_APPROVED"
  | "PROFESSIONAL_VERIFICATION_CHANGES_REQUIRED"
  | "PROFESSIONAL_VERIFICATION_REJECTED"
  | "PROFESSIONAL_VERIFICATION_SUSPENDED";

export type AdminAuditMetadata = Record<
  string,
  string | number | boolean | null
>;

export async function createAdminAuditLog(
  client: AuditClient,
  {
    actorId,
    action,
    entityType,
    entityId,
    reason,
    receiptUrl,
    receiptFile,
    metadata,
  }: {
    actorId: string;
    action: AdminAuditAction;
    entityType: AdminAuditEntityType;
    entityId: string;
    reason?: string | null;
    receiptUrl?: string | null;
    receiptFile?: {
      bytes: Buffer;
      type: string;
      name: string;
    } | null;
    metadata?: AdminAuditMetadata;
  },
) {
  const auditId = randomUUID();
  const resolvedReceiptUrl = receiptFile
    ? `/api/admin/audit-receipts/${auditId}`
    : receiptUrl || null;

  await client.$executeRaw`
    INSERT INTO "AdminAuditLog" (
      "id",
      "actorId",
      "action",
      "entityType",
      "entityId",
      "reason",
      "receiptUrl",
      "receiptFileBytes",
      "receiptFileType",
      "receiptFileName",
      "metadata"
    )
    VALUES (
      ${auditId},
      ${actorId},
      ${action},
      ${entityType},
      ${entityId},
      ${reason || null},
      ${resolvedReceiptUrl},
      ${receiptFile?.bytes || null},
      ${receiptFile?.type || null},
      ${receiptFile?.name || null},
      CAST(${JSON.stringify(metadata ?? {})} AS jsonb)
    )
  `;

  return { id: auditId, receiptUrl: resolvedReceiptUrl };
}

export async function getAdminAuditLogs({
  entityType,
  entityId,
}: {
  entityType: AdminAuditEntityType;
  entityId: string;
}) {
  await requireAdminRole(allowedAdminRolesForAuditEntity(entityType));

  return db.$queryRaw<
    Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string;
      reason: string | null;
      receiptUrl: string | null;
      metadata: Prisma.JsonValue | null;
      createdAt: Date;
      actor: {
        id: string;
        name: string | null;
        email: string | null;
      };
    }>
  >`
    SELECT
      audit."id",
      audit."action",
      audit."entityType",
      audit."entityId",
      audit."reason",
      audit."receiptUrl",
      audit."metadata",
      audit."createdAt",
      json_build_object(
        'id', actor."id",
        'name', actor."name",
        'email', actor."email"
      ) AS "actor"
    FROM "AdminAuditLog" audit
    INNER JOIN "User" actor ON actor."id" = audit."actorId"
    WHERE audit."entityType" = ${entityType}
      AND audit."entityId" = ${entityId}
    ORDER BY audit."createdAt" DESC
  `;
}
