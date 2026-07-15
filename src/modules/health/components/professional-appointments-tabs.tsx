"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  Timer,
  Video,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { CompleteAppointmentButton } from "@/modules/health/components/complete-appointment-button";
import { ProfessionalAppointmentActionButtons } from "@/modules/health/components/professional-appointment-action-buttons";
import { canCompleteHealthAppointment } from "@/modules/health/lib/appointment-completion-time";

type ProfessionalAppointment = {
  id: string;
  date: string;
  time: string;
  durationMinutes: number;
  timezonePro: string;
  status: string;
  price: number;
  meetLink: string | null;
  notes: string | null;
  patientName: string;
  patientId: string;
};

type AppointmentPagination = {
  scheduled: PaginationState;
  history: PaginationState;
};

type PaginationState = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(date));
}

function statusBadge(status: string) {
  if (status === "RESCHEDULING") {
    return {
      label: "Reagendamento em processamento",
      icon: CalendarClock,
      className: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    };
  }

  if (status === "CANCELLING") {
    return {
      label: "Cancelamento em processamento",
      icon: Timer,
      className: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    };
  }

  if (status === "MEETING_PENDING") {
    return {
      label: "Preparando sala",
      icon: Timer,
      className: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    };
  }

  if (status === "MEETING_FAILED") {
    return {
      label: "Reembolsada por falha",
      icon: XCircle,
      className: "bg-red-500/10 text-red-300 border-red-500/20",
    };
  }

  if (status === "COMPLETED") {
    return {
      label: "Realizado",
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
  }

  if (status === "DISPUTED") {
    return {
      label: "Em disputa",
      icon: Timer,
      className: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
    };
  }

  if (status === "NO_SHOW") {
    return {
      label: "Paciente ausente",
      icon: AlertTriangle,
      className: "bg-orange-500/10 text-orange-300 border-orange-500/20",
    };
  }

  if (status === "CANCELED") {
    return {
      label: "Cancelado",
      icon: XCircle,
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    };
  }

  return {
    label: "Agendado",
    icon: Timer,
    className: "bg-[#d73cbe]/10 text-[#d73cbe] border-[#d73cbe]/20",
  };
}

const finishedStatuses: readonly string[] = [
  "CANCELLING",
  "COMPLETED",
  "CANCELED",
  "REFUNDED",
  "NO_SHOW",
  "MEETING_FAILED",
];

function EmptyState({ activeTab }: { activeTab: "scheduled" | "history" }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-20 text-center">
      <div className="rounded-full bg-white/5 p-4 mb-4">
        <CalendarClock className="h-8 w-8 text-slate-600" />
      </div>
      <p className="text-slate-400">
        {activeTab === "scheduled"
          ? "Nenhuma consulta agendada no momento."
          : "Nenhum atendimento no historico ainda."}
      </p>
    </div>
  );
}

export function ProfessionalAppointmentsTabs({
  appointments,
  activeTab,
  pagination,
}: {
  appointments: ProfessionalAppointment[];
  activeTab: "scheduled" | "history";
  pagination: AppointmentPagination;
}) {
  const scheduled = useMemo(
    () =>
      appointments.filter((item) => !finishedStatuses.includes(item.status)),
    [appointments],
  );
  const history = useMemo(
    () => appointments.filter((item) => finishedStatuses.includes(item.status)),
    [appointments],
  );

  const visibleAppointments = activeTab === "scheduled" ? scheduled : history;
  const activePagination = pagination[activeTab];
  const pageHref = (tab: "scheduled" | "history", page: number) => {
    const params = new URLSearchParams({
      tab,
      scheduledPage: String(
        tab === "scheduled" ? page : pagination.scheduled.page,
      ),
      historyPage: String(tab === "history" ? page : pagination.history.page),
    });
    return `/agendar-consulta/dashboard-profissional?${params.toString()}`;
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0f172a]/80 p-8 backdrop-blur-sm">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">
            Atendimentos
          </h2>
          <p className="mt-1 text-slate-400">
            Acompanhe consultas ativas, canceladas e realizadas.
          </p>
        </div>

        <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-[#020617]/70 p-1 text-sm font-bold">
          <Link
            href={pageHref("scheduled", pagination.scheduled.page)}
            className={`cursor-pointer rounded-lg px-4 py-2 transition-colors ${
              activeTab === "scheduled"
                ? "bg-[#d73cbe] text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Agendados ({pagination.scheduled.totalItems})
          </Link>
          <Link
            href={pageHref("history", pagination.history.page)}
            className={`cursor-pointer rounded-lg px-4 py-2 transition-colors ${
              activeTab === "history"
                ? "bg-[#d73cbe] text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Historico ({pagination.history.totalItems})
          </Link>
        </div>
      </div>

      {visibleAppointments.length === 0 ? (
        <EmptyState activeTab={activeTab} />
      ) : (
        <div className="space-y-4">
          {visibleAppointments.map((appointment) => {
            const badge = statusBadge(appointment.status);
            const BadgeIcon = badge.icon;
            const canComplete = canCompleteHealthAppointment({
              date: appointment.date,
              time: appointment.time,
              timeZone: appointment.timezonePro,
              durationMinutes: appointment.durationMinutes,
            });

            return (
              <div
                key={appointment.id}
                className="group relative rounded-2xl border border-white/5 bg-[#020617]/70 p-5 transition-all hover:border-[#d73cbe]/20 hover:bg-[#020617]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${badge.className}`}
                    >
                      <BadgeIcon className="h-3 w-3" />
                      {badge.label}
                    </span>
                    <h3 className="text-xl font-semibold text-white group-hover:text-[#d73cbe] transition-colors">
                      {appointment.patientName}
                    </h3>
                  </div>

                  <div className="grid gap-3 text-sm text-slate-300 md:text-right">
                    <p className="flex items-center gap-2 md:justify-end">
                      <CalendarClock className="h-4 w-4 text-slate-500" />
                      {formatDate(appointment.date)}
                    </p>
                    <p className="flex items-center gap-2 md:justify-end">
                      <Clock3 className="h-4 w-4 text-slate-500" />
                      {appointment.time}
                    </p>
                    <p className="flex items-center gap-2 md:justify-end">
                      <Banknote className="h-4 w-4 text-slate-500" />
                      {formatCurrency(appointment.price)}
                    </p>
                    {appointment.meetLink && (
                      <a
                        href={appointment.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex cursor-pointer items-center gap-2 font-medium text-[#d73cbe] hover:text-white transition-colors md:justify-end"
                      >
                        <Video className="h-4 w-4" />
                        Entrar na sala de atendimento
                      </a>
                    )}
                    {(appointment.status === "CONFIRMED" ||
                      appointment.status === "COMPLETED") && (
                      <Link
                        href={`/agendar-consulta/prontuario/${appointment.patientId}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d73cbe]/20 bg-[#d73cbe]/10 px-4 py-2.5 text-xs font-bold text-[#d73cbe] transition-all hover:bg-[#d73cbe]/20 md:justify-end"
                      >
                        <FileText className="h-4 w-4" />
                        Prontuario
                      </Link>
                    )}
                    {appointment.status === "CONFIRMED" && (
                      <>
                        <CompleteAppointmentButton
                          appointmentId={appointment.id}
                          disabled={!canComplete}
                        />
                        <ProfessionalAppointmentActionButtons
                          appointmentId={appointment.id}
                          canMarkNoShow={canComplete}
                          appointmentDate={appointment.date}
                          appointmentTime={appointment.time}
                        />
                      </>
                    )}
                  </div>
                </div>

                {appointment.notes && (
                  <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-slate-400">
                    <div className="mb-2 flex items-center gap-2 text-slate-300 font-medium">
                      <ShieldCheck className="h-4 w-4 text-[#d73cbe]" />
                      Observacoes
                    </div>
                    {appointment.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activePagination.totalPages > 1 && (
        <nav
          className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5"
          aria-label={`Paginacao de ${activeTab === "scheduled" ? "agendamentos" : "historico"}`}
        >
          <Link
            href={pageHref(activeTab, activePagination.page - 1)}
            aria-disabled={activePagination.page === 1}
            className={`rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold transition-colors ${
              activePagination.page === 1
                ? "pointer-events-none text-slate-700"
                : "text-slate-300 hover:border-[#d73cbe]/40 hover:text-white"
            }`}
          >
            Anterior
          </Link>
          <span className="text-sm text-slate-500">
            Pagina {activePagination.page} de {activePagination.totalPages}
          </span>
          <Link
            href={pageHref(activeTab, activePagination.page + 1)}
            aria-disabled={activePagination.page === activePagination.totalPages}
            className={`rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold transition-colors ${
              activePagination.page === activePagination.totalPages
                ? "pointer-events-none text-slate-700"
                : "text-slate-300 hover:border-[#d73cbe]/40 hover:text-white"
            }`}
          >
            Proxima
          </Link>
        </nav>
      )}
    </div>
  );
}






