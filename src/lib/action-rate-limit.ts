import "server-only";

import { rateLimit } from "@/lib/rate-limit";

export async function consumeRateLimit({
  key,
  limit,
  windowMs,
  message = "Muitas tentativas. Tente novamente em alguns minutos.",
}: {
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
}) {
  const result = await rateLimit(key, limit, windowMs);
  return result.allowed ? null : message;
}
