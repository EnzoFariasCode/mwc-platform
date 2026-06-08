import { auth } from "@/auth";
import { getHealthPatientHistoryById } from "@/modules/health/services/private-profile-service";
import { CancelAppointmentButton } from "@/modules/health/components/cancel-appointment-button";
import { ReportAppointmentDisputeButton } from "@/modules/health/components/report-appointment-dispute-button";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MoreVertical,
  Timer,
  Video,
  XCircle,
} from "lucide-react";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function appointmentDateTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const dateTime = new Date(date);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;

  dateTime.setHours(hours, minutes, 0, 0);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
}

function statusBadge(status: string) {
  if (status === "COMPLETED") {
    return {
      label: "Realizado",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: CheckCircle2,
    };
  }

  if (status === "DISPUTED") {
    return {
      label: "Em disputa",
      className: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
      icon: Timer,
    };
  }

  if (status === "CANCELED") {
    return {
      label: "Cancelado",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: XCircle,
    };
  }

  return {
    label: "Agendado",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Timer,
  };
}

export default async function HistoricoConsultasPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/agendar-consulta/historico");
  }

  const patient = await getHealthPatientHistoryById(session.user.id);
  const appointments = patient?.patientAppointments ?? [];

  return (
    <div className="min-h-screen bg-[#020617] text-white font-poppins pb-24 pt-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-10">
          <h1 className="text-3xl font-futura font-bold uppercase tracking-tight">
            Minhas <span className="text-[#d73cbe]">Consultas</span>
          </h1>
          <p className="text-slate-400 font-light">
            Gerencie seus horários e acesse suas salas de atendimento.
          </p>
        </div>

        {appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const professional = appointment.professional;
              const professionalName =
                professional.displayName || professional.name;
              const badge = statusBadge(appointment.status);
              const BadgeIcon = badge.icon;
              const canCancel =
                !["CANCELED", "COMPLETED", "REFUNDED", "NO_SHOW", "DISPUTED"].includes(
                  appointment.status,
                ) && appointment.date > new Date();
              const scheduledAt = appointmentDateTime(
                appointment.date,
                appointment.time,
              );
              const canDispute =
                appointment.status === "CONFIRMED" &&
                !!scheduledAt &&
                scheduledAt <= new Date();

              return (
                <div
                  key={appointment.id}
                  className="bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0">
                      <Image
                        src={`/api/images/user/${professional.id}`}
                        alt={professionalName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-white leading-tight">
                        {professionalName}
                      </h3>
                      <p className="text-xs text-[#d73cbe] font-medium uppercase tracking-wider mb-2">
                        {professional.jobTitle ||
                          professional.approach ||
                          "Especialista"}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(appointment.date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {appointment.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <span
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${badge.className}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      {badge.label}
                    </span>

                    {canCancel ? (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {appointment.meetLink && (
                          <a
                            href={appointment.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex cursor-pointer items-center gap-2 px-5 py-2.5 bg-[#d73cbe] hover:bg-[#b02da0] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#d73cbe]/20"
                          >
                            <Video className="w-4 h-4" />
                            Entrar no Meet
                          </a>
                        )}
                        <CancelAppointmentButton
                          appointmentId={appointment.id}
                        />
                      </div>
                    ) : canDispute ? (
                      <ReportAppointmentDisputeButton
                        appointmentId={appointment.id}
                      />
                    ) : (
                      <button
                        type="button"
                        className="cursor-pointer p-2.5 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-colors border border-white/5"
                        aria-label="Mais opções"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/[0.02] rounded-[32px] border border-dashed border-white/10">
            <p className="text-slate-500">
              Você ainda não possui agendamentos.
            </p>
            <Link
              href="/agendar-consulta"
              className="cursor-pointer text-[#d73cbe] text-sm mt-4 inline-block hover:underline"
            >
              Começar agora
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}




