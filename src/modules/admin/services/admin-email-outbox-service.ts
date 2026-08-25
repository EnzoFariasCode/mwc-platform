import "server-only";

import { EmailOutboxStatus, Prisma } from "@prisma/client";

import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { adminEmailAccessWhere } from "@/modules/admin/lib/admin-email-access";
import { EMAIL_OUTBOX_HEARTBEAT_KEY } from "@/modules/email/services/email-operations-service";

const PAGE_SIZE = 25;
const ADMIN_EMAIL_ROLES = ["OWNER", "FINANCE", "SUPPORT"] as const;

export const EMAIL_OUTBOX_STATUS_FILTERS = [
  "ALL",
  ...Object.values(EmailOutboxStatus),
] as const;
export type EmailOutboxStatusFilter =
  (typeof EMAIL_OUTBOX_STATUS_FILTERS)[number];

function normalizeStatus(value?: string): EmailOutboxStatusFilter {
  return EMAIL_OUTBOX_STATUS_FILTERS.includes(
    value as EmailOutboxStatusFilter,
  )
    ? (value as EmailOutboxStatusFilter)
    : "ALL";
}

function normalizePage(value?: string | number) {
  const parsed = typeof value === "number" ? value : Number.parseInt(value || "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function configurationStatus(input: {
  webhookStatus?: string;
  webhookCreatedAt?: Date;
  cronStatus?: string;
  cronLastSucceededAt?: Date | null;
  now: Date;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  let validProductionUrl = false;
  try {
    validProductionUrl = Boolean(appUrl && new URL(appUrl).protocol === "https:");
  } catch {
    validProductionUrl = false;
  }

  return [
    {
      key: "RESEND_API_KEY",
      label: "Chave da API Resend",
      configured: Boolean(process.env.RESEND_API_KEY),
    },
    {
      key: "RESEND_FROM_EMAIL",
      label: "Remetente verificado",
      configured: Boolean(process.env.RESEND_FROM_EMAIL),
    },
    {
      key: "RESEND_WEBHOOK_SECRET",
      label: "Assinatura do webhook",
      configured: Boolean(process.env.RESEND_WEBHOOK_SECRET),
    },
    {
      key: "CRON_SECRET",
      label: "Processador agendado",
      configured: Boolean(
        process.env.CRON_SECRET &&
          input.cronStatus === "SUCCESS" &&
          input.cronLastSucceededAt &&
          input.now.getTime() - input.cronLastSucceededAt.getTime() <=
            20 * 60 * 1_000,
      ),
    },
    {
      key: "NEXT_PUBLIC_APP_URL",
      label: "URL publica HTTPS",
      configured: validProductionUrl,
    },
    {
      key: "RESEND_WEBHOOK_ACTIVITY",
      label: "Webhook ja observado",
      configured: Boolean(
        input.webhookStatus &&
          input.webhookStatus !== "FAILED" &&
          input.webhookCreatedAt &&
          input.now.getTime() - input.webhookCreatedAt.getTime() <=
            30 * 24 * 60 * 60 * 1_000,
      ),
    },
  ];
}

export async function getAdminEmailOutboxDashboard(input: {
  page?: string | number;
  status?: string;
  search?: string;
}) {
  const admin = await requireAdminRole([...ADMIN_EMAIL_ROLES]);

  const requestedPage = normalizePage(input.page);
  const status = normalizeStatus(input.status);
  const search = input.search?.trim().slice(0, 160) || "";
  const requestedWhere: Prisma.EmailOutboxWhereInput = {
    ...(status === "ALL" ? {} : { status }),
    ...(search
      ? {
          OR: [
            { recipientEmail: { contains: search, mode: "insensitive" } },
            { eventType: { contains: search, mode: "insensitive" } },
            { idempotencyKey: { contains: search, mode: "insensitive" } },
            { providerMessageId: { contains: search, mode: "insensitive" } },
            { entityId: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const accessWhere = adminEmailAccessWhere(admin.adminRole);
  const where: Prisma.EmailOutboxWhereInput = {
    AND: [accessWhere, requestedWhere],
  };
  const now = new Date();
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentScope: Prisma.EmailOutboxWhereInput = {
    AND: [accessWhere, { createdAt: { gte: since } }],
  };

  const [
    totalItems,
    statusCounts,
    eventMetrics,
    recentEvaluated,
    recentDelivered,
    recentAttention,
    latestWebhook,
    cronHeartbeat,
  ] = await Promise.all([
    db.emailOutbox.count({ where }),
    db.emailOutbox.groupBy({
      by: ["status"],
      where: accessWhere,
      _count: { _all: true },
    }),
    db.emailOutbox.groupBy({
      by: ["eventType", "status"],
      where: recentScope,
      _count: { _all: true },
      orderBy: { eventType: "asc" },
    }),
    db.emailOutbox.count({
      where: {
        AND: [
          recentScope,
          {
            status: {
              in: [
                EmailOutboxStatus.DELIVERED,
                EmailOutboxStatus.REQUIRES_ATTENTION,
              ],
            },
          },
        ],
      },
    }),
    db.emailOutbox.count({
      where: {
        AND: [recentScope, { status: EmailOutboxStatus.DELIVERED }],
      },
    }),
    db.emailOutbox.count({
      where: {
        AND: [
          recentScope,
          { status: EmailOutboxStatus.REQUIRES_ATTENTION },
        ],
      },
    }),
    db.emailWebhookEventLog.findFirst({
      where: { provider: "RESEND" },
      orderBy: { createdAt: "desc" },
      select: { eventType: true, status: true, createdAt: true },
    }),
    db.emailOperationsHeartbeat.findUnique({
      where: { key: EMAIL_OUTBOX_HEARTBEAT_KEY },
      select: {
        status: true,
        lastStartedAt: true,
        lastSucceededAt: true,
        lastFailedAt: true,
        lastDurationMs: true,
        lastErrorCode: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const emails = await db.emailOutbox.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      eventType: true,
      recipientEmail: true,
      status: true,
      attemptCount: true,
      maxAttempts: true,
      nextAttemptAt: true,
      providerMessageId: true,
      lastErrorCode: true,
      lastErrorMessage: true,
      sentAt: true,
      deliveredAt: true,
      createdAt: true,
      retry: { select: { id: true, status: true } },
    },
  });

  const metricsByEvent = new Map<
    string,
    { total: number; delivered: number; attention: number; pending: number }
  >();
  for (const item of eventMetrics) {
    const metric = metricsByEvent.get(item.eventType) ?? {
      total: 0,
      delivered: 0,
      attention: 0,
      pending: 0,
    };
    metric.total += item._count._all;
    if (item.status === EmailOutboxStatus.DELIVERED) {
      metric.delivered += item._count._all;
    }
    if (item.status === EmailOutboxStatus.REQUIRES_ATTENTION) {
      metric.attention += item._count._all;
    }
    if (
      new Set<EmailOutboxStatus>([
        EmailOutboxStatus.PENDING,
        EmailOutboxStatus.PROCESSING,
        EmailOutboxStatus.FAILED,
      ]).has(item.status)
    ) {
      metric.pending += item._count._all;
    }
    metricsByEvent.set(item.eventType, metric);
  }

  return {
    canRunSmokeTest: admin.adminRole === "OWNER",
    emails,
    filters: { status, search },
    pagination: { page, pageSize: PAGE_SIZE, totalItems, totalPages },
    statusCounts: Object.fromEntries(
      Object.values(EmailOutboxStatus).map((item) => [
        item,
        statusCounts.find((entry) => entry.status === item)?._count._all ?? 0,
      ]),
    ) as Record<EmailOutboxStatus, number>,
    recent: {
      total: recentEvaluated,
      delivered: recentDelivered,
      attention: recentAttention,
      deliveryRate:
        recentEvaluated > 0
          ? Math.round((recentDelivered / recentEvaluated) * 1000) / 10
          : 0,
    },
    eventMetrics: Array.from(metricsByEvent, ([eventType, metric]) => ({
      eventType,
      ...metric,
    })),
    configuration: configurationStatus({
      webhookStatus: latestWebhook?.status,
      webhookCreatedAt: latestWebhook?.createdAt,
      cronStatus: cronHeartbeat?.status,
      cronLastSucceededAt: cronHeartbeat?.lastSucceededAt,
      now,
    }),
    latestWebhook,
    cronHeartbeat,
  };
}

export async function getAdminEmailOutboxDetail(id: string) {
  const admin = await requireAdminRole([...ADMIN_EMAIL_ROLES]);
  return db.emailOutbox.findFirst({
    where: { AND: [{ id }, adminEmailAccessWhere(admin.adminRole)] },
    include: {
      attempts: { orderBy: { attemptNumber: "desc" } },
      retryOf: { select: { id: true, status: true } },
      retry: { select: { id: true, status: true } },
    },
  });
}
