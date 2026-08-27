import "server-only";

import { after } from "next/server";

const DISPATCH_BATCH_SIZE = 25;
const DISPATCH_CONCURRENCY = 5;

/**
 * Agenda o consumo da outbox para depois que a resposta atual terminar.
 *
 * O registro e criado dentro da transacao principal; o processamento ocorre
 * somente apos a resposta, quando a transacao ja foi confirmada. Em contextos
 * sem ciclo HTTP (scripts, testes e workers), `after` nao esta disponivel e o
 * cron continua sendo a camada de recuperacao.
 */
export function scheduleEmailOutboxDispatch() {
  try {
    after(async () => {
      try {
        // Importacao tardia evita um ciclo estatico com email-outbox-service.
        const { processEmailOutbox } = await import("./email-outbox-processor");
        const metrics = await processEmailOutbox({
          batchSize: DISPATCH_BATCH_SIZE,
          concurrency: DISPATCH_CONCURRENCY,
        });
        console.info("[EMAIL_OUTBOX_POST_RESPONSE_DISPATCH]", metrics);
      } catch (error) {
        console.error("[EMAIL_OUTBOX_POST_RESPONSE_DISPATCH_ERROR]", {
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      }
    });

    return true;
  } catch {
    return false;
  }
}
