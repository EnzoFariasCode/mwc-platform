import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  CalendarClock,
  Clock3,
  MapPin,
  ShieldCheck,
  Video,
} from "lucide-react";
import { getHealthPatientHistoryById } from "@/modules/health/services/private-profile-service";

function formatCurrency(value: number | null) {
  if (value == null) return "A combinar";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function HealthPatientHistoryPage() {
  const session = await auth();

  if (!session) {
    redirect("/login?callbackUrl=/agendar-consulta/historico");
  }

  if (session.user?.userType === "PROFESSIONAL") {
    redirect("/agendar-consulta/dashboard-profissional");
  }

  const patient = await getHealthPatientHistoryById(session.user.id);

  if (!patient) {
    redirect("/portal");
  }

  const displayName = patient.displayName || patient.name;

  return (
    <div className="min-h-screen bg-[#020617] text-white px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#0f172a]/80 p-8 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">
              Área do Paciente
            </p>
            <h1 className="mt-3 text-3xl font-futura font-bold uppercase">
              {displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Acompanhe suas consultas agendadas, acesse links de atendimento e
              volte rapidamente para o portal Health quando quiser marcar uma
              nova sessão.
            </p>
          </div>
          <Link
            href="/agendar-consulta"
            className="inline-flex items-center gap-2 rounded-2xl border border-[#d73cbe]/30 bg-[#d73cbe]/10 px-5 py-3 text-sm font-semibold text-[#d73cbe] transition-colors hover:bg-[#d73cbe] hover:text-white"
          >
            <Activity className="h-4 w-4" />
            Explorar especialistas
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 p-6">
            <p className="text-sm text-slate-500">Consultas totais</p>
            <p className="mt-2 text-3xl font-bold">
              {patient.patientAppointments.length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 p-6">
            <p className="text-sm text-slate-500">Próxima sessão</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {patient.patientAppointments[0]
                ? formatDate(patient.patientAppointments[0].date)
                : "Nenhuma agendada"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 p-6">
            <p className="text-sm text-slate-500">Localização</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
              <MapPin className="h-4 w-4 text-[#d73cbe]" />
              {patient.city && patient.state
                ? `${patient.city}, ${patient.state}`
                : "Não informada"}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0f172a]/80 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-futura font-bold uppercase">
              Minhas consultas
            </h2>
            <p className="mt-2 text-slate-400">
              Visão rápida das sessões já marcadas com seus especialistas.
            </p>
          </div>

          {patient.patientAppointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
              <p className="text-slate-400">
                Você ainda não possui consultas agendadas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {patient.patientAppointments.map((appointment) => {
                const professionalName =
                  appointment.professional.displayName ||
                  appointment.professional.name;

                return (
                  <div
                    key={appointment.id}
                    className="rounded-2xl border border-white/10 bg-[#020617]/70 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#d73cbe]">
                          {appointment.status}
                        </p>
                        <h3 className="text-xl font-semibold text-white">
                          {professionalName}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {appointment.professional.jobTitle || "Especialista"}
                          {appointment.professional.approach
                            ? ` • ${appointment.professional.approach}`
                            : ""}
                        </p>
                      </div>

                      <div className="grid gap-3 text-sm text-slate-300 md:text-right">
                        <p className="flex items-center gap-2 md:justify-end">
                          <CalendarClock className="h-4 w-4 text-[#d73cbe]" />
                          {formatDate(appointment.date)}
                        </p>
                        <p className="flex items-center gap-2 md:justify-end">
                          <Clock3 className="h-4 w-4 text-[#d73cbe]" />
                          {formatCurrency(Number(appointment.price))}
                        </p>
                        {appointment.meetLink && (
                          <a
                            href={appointment.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-[#d73cbe] hover:text-white md:justify-end"
                          >
                            <Video className="h-4 w-4" />
                            Acessar videochamada
                          </a>
                        )}
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-400">
                        <div className="mb-2 flex items-center gap-2 text-slate-300">
                          <ShieldCheck className="h-4 w-4 text-[#d73cbe]" />
                          Observações enviadas
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
      </div>
    </div>
  );
}
