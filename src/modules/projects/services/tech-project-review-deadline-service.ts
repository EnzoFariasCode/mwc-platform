import "server-only";

import { db } from "@/lib/prisma";
import { upsertNotification } from "@/modules/notifications/services/notification-service";
import { releaseTechProjectPayment } from "@/modules/projects/services/tech-project-release-service";
import { ProjectStatus } from "@prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100;

async function notifyUpcomingDeadline({
  projectId,
  daysRemaining,
  now,
}: {
  projectId: string;
  daysRemaining: 1 | 3;
  now: Date;
}) {
  return db.$transaction(async (tx) => {
    const claimed = await tx.project.updateMany({
      where: {
        id: projectId,
        status: ProjectStatus.UNDER_REVIEW,
        reviewDeadlineAt: { gt: now },
        ...(daysRemaining === 3
          ? { reviewReminder3dSentAt: null }
          : { reviewReminder1dSentAt: null }),
      },
      data:
        daysRemaining === 3
          ? { reviewReminder3dSentAt: now }
          : { reviewReminder1dSentAt: now },
    });
    if (claimed.count !== 1) return false;

    const project = await tx.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true, title: true, reviewDeadlineAt: true },
    });
    if (!project?.reviewDeadlineAt) return false;

    await upsertNotification(
      {
        userId: project.ownerId,
        type: "WARNING",
        eventType: `TECH_REVIEW_DEADLINE_${daysRemaining}D`,
        title: "Prazo para analisar a entrega",
        message: `Voce tem ${daysRemaining === 1 ? "menos de 1 dia" : "ate 3 dias"} para aprovar, pedir revisao ou abrir disputa em "${project.title}". Sem acao, o pagamento sera liberado.`,
        link: "/dashboard/meus-projetos",
        entityType: "TECH_PROJECT",
        entityId: projectId,
        metadata: {
          projectId,
          daysRemaining,
          reviewDeadlineAt: project.reviewDeadlineAt.toISOString(),
        },
      },
      tx,
    );

    return true;
  });
}

export async function processTechProjectReviewDeadlines(now = new Date()) {
  const oneDayAhead = new Date(now.getTime() + DAY_MS);
  const threeDaysAhead = new Date(now.getTime() + 3 * DAY_MS);

  const [expired, oneDayReminders, threeDayReminders] = await Promise.all([
    db.project.findMany({
      where: {
        status: ProjectStatus.UNDER_REVIEW,
        reviewDeadlineAt: { lte: now },
      },
      select: { id: true },
      orderBy: { reviewDeadlineAt: "asc" },
      take: BATCH_SIZE,
    }),
    db.project.findMany({
      where: {
        status: ProjectStatus.UNDER_REVIEW,
        reviewDeadlineAt: { gt: now, lte: oneDayAhead },
        reviewReminder1dSentAt: null,
      },
      select: { id: true },
      orderBy: { reviewDeadlineAt: "asc" },
      take: BATCH_SIZE,
    }),
    db.project.findMany({
      where: {
        status: ProjectStatus.UNDER_REVIEW,
        reviewDeadlineAt: { gt: oneDayAhead, lte: threeDaysAhead },
        reviewReminder3dSentAt: null,
      },
      select: { id: true },
      orderBy: { reviewDeadlineAt: "asc" },
      take: BATCH_SIZE,
    }),
  ]);

  const releaseResults = await Promise.allSettled(
    expired.map((project) =>
      releaseTechProjectPayment({
        projectId: project.id,
        source: "AUTO_REVIEW_DEADLINE",
      }),
    ),
  );
  const reminderResults = await Promise.allSettled([
    ...oneDayReminders.map((project) =>
      notifyUpcomingDeadline({ projectId: project.id, daysRemaining: 1, now }),
    ),
    ...threeDayReminders.map((project) =>
      notifyUpcomingDeadline({ projectId: project.id, daysRemaining: 3, now }),
    ),
  ]);

  const errors = [...releaseResults, ...reminderResults]
    .filter((result) => result.status === "rejected")
    .map((result) =>
      result.status === "rejected" ? String(result.reason) : "",
    );

  if (errors.length > 0) {
    console.error("[TECH_PROJECT_REVIEW_DEADLINE_ERRORS]", errors);
  }

  return {
    expiredFound: expired.length,
    released: releaseResults.filter(
      (result) => result.status === "fulfilled" && result.value.released,
    ).length,
    remindersSent: reminderResults.filter(
      (result) => result.status === "fulfilled" && result.value,
    ).length,
    errors: errors.length,
  };
}
