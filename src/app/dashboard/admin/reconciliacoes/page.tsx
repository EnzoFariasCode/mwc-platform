import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import { requireAdminRole } from "@/lib/get-session";
import { db } from "@/lib/prisma";
import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { ReconciliationActions } from "./ReconciliationActions";
import { RescheduleReconciliationAction } from "./RescheduleReconciliationAction";
import { MeetingReconciliationActions } from "./MeetingReconciliationActions";
import { AdminPageHeader } from "@/modules/admin/components/AdminPageHeader";

function stepLabel(status: string) {
  return status === "PENDING"
    ? "Pendente"
    : status === "SKIPPED"
      ? "Dispensado"
      : "Concluido";
}

function ProcessState({ manual }: { manual: boolean }) {
  return (
    <>
      {manual ? (
        <AlertTriangle className="h-5 w-5 text-amber-300" />
      ) : (
        <Clock3 className="h-5 w-5 text-blue-300" />
      )}
      <span
        className={`rounded-md border px-2 py-1 text-xs font-semibold ${
          manual
            ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
            : "border-blue-500/20 bg-blue-500/10 text-blue-300"
        }`}
      >
        {manual ? "Acao manual necessaria" : "Retry automatico"}
      </span>
    </>
  );
}

export default async function AdminReconciliacoesPage() {
  const admin = await requireAdminRole(["OWNER", "FINANCE", "SUPPORT"]);

  const [meetings, cancellations, reschedules] = await Promise.all([
    db.appointment.findMany({
      where: { status: "MEETING_REQUIRES_ATTENTION" },
      orderBy: { meetAttentionRequiredAt: "asc" },
      select: {
        id: true,
        shortId: true,
        date: true,
        time: true,
        price: true,
        meetRetryCount: true,
        meetLastError: true,
        meetAttentionRequiredAt: true,
        googleEventId: true,
        patient: { select: { name: true } },
        professional: { select: { name: true } },
        meetingAttempts: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            operation: true,
            outcome: true,
            providerStatus: true,
            errorMessage: true,
            createdAt: true,
          },
        },
      },
    }),
    db.appointmentCancellationProcess.findMany({
      where: { status: { not: "COMPLETED" } },
      orderBy: [{ status: "asc" }, { updatedAt: "asc" }],
      include: {
        appointment: {
          select: {
            shortId: true,
            date: true,
            time: true,
            patient: { select: { name: true } },
            professional: { select: { name: true } },
          },
        },
      },
    }),
    db.appointmentRescheduleProcess.findMany({
      where: { status: { not: "COMPLETED" } },
      orderBy: [{ status: "asc" }, { updatedAt: "asc" }],
      include: {
        appointment: {
          select: {
            shortId: true,
            patient: { select: { name: true } },
            professional: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const hasProcesses =
    meetings.length > 0 || cancellations.length > 0 || reschedules.length > 0;
  const canManageMeetings =
    admin.adminRole === "OWNER" || admin.adminRole === "SUPPORT";

  return (
    <PageContainer>
      <section className="space-y-5">
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel
        </Link>
        <AdminPageHeader
          eyebrow="Operação assistida"
          title="Reconciliação MWC Online"
          description="Acompanhe salas, cancelamentos e reagendamentos que exigem intervenção. Falhas técnicas na sala não cancelam o pagamento."
          icon={Clock3}
          tone="warning"
        />
      </section>

      {!hasProcesses ? (
        <section className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 text-center">
          <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-400" />
          <h2 className="font-semibold text-white">Nenhuma pendencia</h2>
          <p className="mt-1 text-sm text-slate-500">
            Todas as operacoes foram reconciliadas.
          </p>
        </section>
      ) : (
        <section className="space-y-8">
          {meetings.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Salas de atendimento
              </h2>
              {meetings.map((appointment) => (
                <article
                  key={appointment.id}
                  className="rounded-xl border border-amber-500/20 bg-slate-900/70 p-4 sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <ProcessState manual />
                        <h3 className="font-semibold text-white">
                          Consulta {appointment.shortId}
                        </h3>
                      </div>
                      <p className="mt-3 text-sm text-slate-300">
                        {appointment.patient.name} para{" "}
                        {appointment.professional.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {appointment.date.toLocaleDateString("pt-BR")} as{" "}
                        {appointment.time} · {appointment.meetRetryCount} falhas
                        tecnicas
                      </p>
                      {appointment.meetAttentionRequiredAt && (
                        <p className="mt-1 text-xs text-slate-500 [overflow-wrap:anywhere]">
                          Em suporte desde{" "}
                          {appointment.meetAttentionRequiredAt.toLocaleString(
                            "pt-BR",
                          )}
                          {appointment.googleEventId
                            ? ` · Evento ${appointment.googleEventId}`
                            : " · Evento ainda nao criado"}
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">
                      Pagamento preservado:{" "}
                      {Number(appointment.price).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                  </div>

                  {appointment.meetLastError && (
                    <p className="mt-4 rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2 text-xs leading-5 text-red-200 [overflow-wrap:anywhere]">
                      {appointment.meetLastError}
                    </p>
                  )}

                  {appointment.meetingAttempts.length > 0 && (
                    <div className="mt-4 space-y-1 text-xs text-slate-500">
                      {appointment.meetingAttempts.map((attempt) => (
                        <p key={attempt.id} className="[overflow-wrap:anywhere]">
                          {attempt.createdAt.toLocaleString("pt-BR")} ·{" "}
                          {attempt.operation} ·{" "}
                          {attempt.providerStatus || attempt.outcome}
                          {attempt.errorMessage
                            ? ` · ${attempt.errorMessage}`
                            : ""}
                        </p>
                      ))}
                    </div>
                  )}

                  {canManageMeetings ? (
                    <MeetingReconciliationActions
                      appointmentId={appointment.id}
                    />
                  ) : (
                    <p className="mt-4 border-t border-white/10 pt-4 text-xs text-slate-500">
                      A tratativa da sala requer perfil de suporte ou
                      proprietario.
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}

          {cancellations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Cancelamentos</h2>
              {cancellations.map((process) => {
                const manual = process.status === "RECONCILIATION_REQUIRED";
                return (
                  <article
                    key={process.id}
                    className="rounded-xl border border-white/10 bg-slate-900/70 p-4 sm:p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <ProcessState manual={manual} />
                          <h3 className="font-semibold text-white">
                            Consulta {process.appointment.shortId}
                          </h3>
                        </div>
                        <p className="mt-3 text-sm text-slate-300">
                          {process.appointment.patient.name} para {process.appointment.professional.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {process.appointment.date.toLocaleDateString("pt-BR")} as {process.appointment.time} - tentativa {process.attemptCount}/{process.maxAttempts}
                        </p>
                      </div>
                      <dl className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-80">
                        {[
                          ["Meet", process.meetStatus],
                          ["Reembolso", process.refundStatus],
                          ["Saldo", process.escrowStatus],
                        ].map(([label, status]) => (
                          <div key={label} className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2">
                            <dt className="text-slate-500">{label}</dt>
                            <dd className="mt-1 font-semibold text-slate-200">{stepLabel(status)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    {process.lastError && (
                      <p className="mt-4 rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2 text-xs leading-5 text-red-200 [overflow-wrap:anywhere]">
                        {process.lastError}
                      </p>
                    )}
                    {manual && (
                      <ReconciliationActions
                        processId={process.id}
                        meetPending={process.meetStatus === "PENDING"}
                        refundPending={process.refundStatus === "PENDING"}
                        canAttachRefund={
                          admin.adminRole === "OWNER" ||
                          admin.adminRole === "FINANCE"
                        }
                      />
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {reschedules.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Reagendamentos</h2>
              {reschedules.map((process) => {
                const manual = process.status === "RECONCILIATION_REQUIRED";
                return (
                  <article
                    key={process.id}
                    className="rounded-xl border border-white/10 bg-slate-900/70 p-4 sm:p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <ProcessState manual={manual} />
                          <h3 className="font-semibold text-white">
                            Consulta {process.appointment.shortId}
                          </h3>
                        </div>
                        <p className="mt-3 text-sm text-slate-300">
                          {process.appointment.patient.name} para {process.appointment.professional.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {process.previousDate.toLocaleDateString("pt-BR")} as {process.previousTime} para {process.newDate.toLocaleDateString("pt-BR")} as {process.newTime}
                        </p>
                      </div>
                      <dl className="grid grid-cols-2 gap-2 text-center text-xs sm:min-w-56">
                        {[
                          ["Calendar", process.calendarStatus],
                          ["Banco", process.databaseStatus],
                        ].map(([label, status]) => (
                          <div key={label} className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2">
                            <dt className="text-slate-500">{label}</dt>
                            <dd className="mt-1 font-semibold text-slate-200">{stepLabel(status)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    {process.lastError && (
                      <p className="mt-4 rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2 text-xs leading-5 text-red-200 [overflow-wrap:anywhere]">
                        {process.lastError}
                      </p>
                    )}
                    {manual && (
                      <RescheduleReconciliationAction processId={process.id} />
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </PageContainer>
  );
}
