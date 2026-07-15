import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { ReconciliationActions } from "./ReconciliationActions";

function stepLabel(status: string) {
  return status === "PENDING"
    ? "Pendente"
    : status === "SKIPPED"
      ? "Dispensado"
      : "Concluído";
}

export default async function AdminReconciliacoesPage() {
  await requireAdminRole(["OWNER", "FINANCE", "SUPPORT"]);

  const processes = await db.appointmentCancellationProcess.findMany({
    where: { status: { not: "COMPLETED" } },
    orderBy: [{ status: "asc" }, { updatedAt: "asc" }],
    include: {
      appointment: {
        select: {
          shortId: true,
          date: true,
          time: true,
          patient: { select: { name: true, email: true } },
          professional: { select: { name: true, email: true } },
        },
      },
    },
  });

  return (
    <PageContainer>
      <section className="space-y-3">
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">
            Reconciliação de cancelamentos
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Acompanhe tentativas automáticas e trate somente as exceções que
            exigem intervenção.
          </p>
        </div>
      </section>

      {processes.length === 0 ? (
        <section className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 text-center">
          <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-400" />
          <h2 className="font-semibold text-white">Nenhuma pendência</h2>
          <p className="mt-1 text-sm text-slate-500">
            Todos os cancelamentos foram reconciliados.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {processes.map((process) => {
            const manual = process.status === "RECONCILIATION_REQUIRED";
            return (
              <article
                key={process.id}
                className="rounded-lg border border-white/10 bg-slate-900/70 p-5"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {manual ? (
                        <AlertTriangle className="h-5 w-5 text-amber-300" />
                      ) : (
                        <Clock3 className="h-5 w-5 text-blue-300" />
                      )}
                      <h2 className="font-semibold text-white">
                        Consulta {process.appointment.shortId}
                      </h2>
                      <span
                        className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                          manual
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                            : "border-blue-500/20 bg-blue-500/10 text-blue-300"
                        }`}
                      >
                        {manual ? "Ação manual necessária" : "Retry automático"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">
                      {process.appointment.patient.name} →{" "}
                      {process.appointment.professional.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {process.appointment.date.toLocaleDateString("pt-BR")} às{" "}
                      {process.appointment.time} · tentativa {process.attemptCount}/
                      {process.maxAttempts}
                    </p>
                  </div>

                  <dl className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-80">
                    {[
                      ["Meet", process.meetStatus],
                      ["Reembolso", process.refundStatus],
                      ["Saldo", process.escrowStatus],
                    ].map(([label, status]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2"
                      >
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="mt-1 font-semibold text-slate-200">
                          {stepLabel(status)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {process.lastError && (
                  <p className="mt-4 rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2 text-xs leading-5 text-red-200">
                    {process.lastError}
                  </p>
                )}

                {manual && (
                  <ReconciliationActions
                    processId={process.id}
                    meetPending={process.meetStatus === "PENDING"}
                    refundPending={process.refundStatus === "PENDING"}
                  />
                )}
              </article>
            );
          })}
        </section>
      )}
    </PageContainer>
  );
}
