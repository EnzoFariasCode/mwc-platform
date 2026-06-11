"use client";

import { useMemo, useState } from "react";
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

type ProfessionalAppointment = {
  id: string;
  date: string;
  time: string;
  status: string;
  price: number;
  meetLink: string | null;
  notes: string | null;
  patientName: string;
  patientId: string;
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

function canCompleteAppointment(date: string, time: string) {
  const appointmentDate = new Date(date);
  const [hours, minutes] = time.split(":").map(Number);

  if (
    Number.isNaN(appointmentDate.getTime()) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return false;
  }

  appointmentDate.setHours(hours, minutes, 0, 0);
  return appointmentDate <= new Date();
}

function statusBadge(status: string) {
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
  "COMPLETED",
  "CANCELED",
  "REFUNDED",
  "NO_SHOW",
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
}: {
  appointments: ProfessionalAppointment[];
}) {
  const [activeTab, setActiveTab] = useState<"scheduled" | "history">(
    "scheduled",
  );

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
          <button
            type="button"
            onClick={() => setActiveTab("scheduled")}
            className={`cursor-pointer rounded-lg px-4 py-2 transition-colors ${
              activeTab === "scheduled"
                ? "bg-[#d73cbe] text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Agendados ({scheduled.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`cursor-pointer rounded-lg px-4 py-2 transition-colors ${
              activeTab === "history"
                ? "bg-[#d73cbe] text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Historico ({history.length})
          </button>
        </div>
      </div>

      {visibleAppointments.length === 0 ? (
        <EmptyState activeTab={activeTab} />
      ) : (
        <div className="space-y-4">
          {visibleAppointments.map((appointment) => {
            const badge = statusBadge(appointment.status);
            const BadgeIcon = badge.icon;
            const canComplete = canCompleteAppointment(
              appointment.date,
              appointment.time,
            );

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
    </div>
  );
}






