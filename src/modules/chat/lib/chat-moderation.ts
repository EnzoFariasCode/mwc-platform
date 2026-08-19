import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/prisma";
export {
  CHAT_REPORT_DESCRIPTION_MAX_LENGTH,
  CHAT_REPORT_DESCRIPTION_MIN_LENGTH,
  CHAT_REPORT_REASONS,
  isChatReportReason,
  normalizeChatReportDescription,
  type ChatReportReasonValue,
} from "@/modules/chat/lib/chat-report-config";

type ChatModerationClient = Prisma.TransactionClient | typeof db;

export async function findChatBlockBetween(
  firstUserId: string,
  secondUserId: string,
  client: ChatModerationClient = db,
) {
  return client.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: firstUserId, blockedUserId: secondUserId },
        { blockerId: secondUserId, blockedUserId: firstUserId },
      ],
    },
    select: { id: true, blockerId: true, blockedUserId: true },
  });
}

export async function getBlockedCounterpartIds(
  userId: string,
  client: ChatModerationClient = db,
) {
  const blocks = await client.userBlock.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedUserId: userId }],
    },
    select: { blockerId: true, blockedUserId: true },
  });

  return Array.from(
    new Set(
      blocks.map((block) =>
        block.blockerId === userId ? block.blockedUserId : block.blockerId,
      ),
    ),
  );
}
