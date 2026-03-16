import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/prisma";

type RateLimitResult = {
  allowed: boolean;
  resetAt: Date;
  remaining: number;
};

function getClientIp() {
  const h = headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = h.get("x-real-ip") || h.get("cf-connecting-ip");
  return realIp || "unknown";
}

export function getRateLimitKeys(prefix: string, identifier?: string) {
  const ip = getClientIp();
  const keys = [`${prefix}:ip:${ip}`];
  if (identifier) {
    keys.push(`${prefix}:id:${identifier.toLowerCase()}`);
  }
  return keys;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  const updated = await db.rateLimit.updateMany({
    where: {
      key,
      resetAt: { gt: now },
      count: { lt: limit },
    },
    data: { count: { increment: 1 } },
  });

  if (updated.count === 1) {
    const record = await db.rateLimit.findUnique({
      where: { key },
      select: { count: true, resetAt: true },
    });
    const remaining = record ? Math.max(limit - record.count, 0) : 0;
    return { allowed: true, resetAt: record?.resetAt ?? resetAt, remaining };
  }

  const record = await db.rateLimit.findUnique({
    where: { key },
    select: { count: true, resetAt: true },
  });

  if (!record || record.resetAt <= now) {
    await db.rateLimit.upsert({
      where: { key },
      update: { count: 1, resetAt },
      create: { key, count: 1, resetAt },
    });
    return { allowed: true, resetAt, remaining: limit - 1 };
  }

  return { allowed: false, resetAt: record.resetAt, remaining: 0 };
}
