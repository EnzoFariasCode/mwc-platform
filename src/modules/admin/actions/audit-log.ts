"use server";

import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/prisma";

type AuditClient = Pick<typeof db, "$executeRaw">;

export type AdminAuditAction =
  | "TECH_DISPUTE_REFUND_CLIENT"
  | "TECH_DISPUTE_RELEASE_PROFESSIONAL"
  | "HEALTH_DISPUTE_REFUND_PATIENT"
  | "HEALTH_DISPUTE_RELEASE_PROFESSIONAL"
  | "PIX_WITHDRAWAL_MARK_COMPLETED"
  | "PIX_WITHDRAWAL_REJECTED"
  | "PIX_WITHDRAWAL_CANCELED"
  | "PIX_WITHDRAWAL_RECEIPT_ATTACHED"
  | "USER_ACCOUNT_SUSPENDED"
  | "USER_ACCOUNT_REACTIVATED"
  | "ADMIN_ROLE_UPDATED";

export type AdminAuditEntityType =
  | "TECH_PROJECT"
  | "HEALTH_APPOINTMENT"
  | "WITHDRAWAL_REQUEST"
  | "USER_ACCOUNT";

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
    metadata,
  }: {
    actorId: string;
    action: AdminAuditAction;
    entityType: AdminAuditEntityType;
    entityId: string;
    reason?: string | null;
    receiptUrl?: string | null;
    metadata?: AdminAuditMetadata;
  },
) {
  await client.$executeRaw`
    INSERT INTO "AdminAuditLog" (
      "id",
      "actorId",
      "action",
      "entityType",
      "entityId",
      "reason",
      "receiptUrl",
      "metadata"
    )
    VALUES (
      ${randomUUID()},
      ${actorId},
      ${action},
      ${entityType},
      ${entityId},
      ${reason || null},
      ${receiptUrl || null},
      CAST(${JSON.stringify(metadata ?? {})} AS jsonb)
    )
  `;
}

export async function getAdminAuditLogs({
  entityType,
  entityId,
}: {
  entityType: AdminAuditEntityType;
  entityId: string;
}) {
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
