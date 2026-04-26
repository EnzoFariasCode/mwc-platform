import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  Clock3,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Star,
  Video,
} from "lucide-react";
import { getHealthProfessionalDashboardById } from "@/modules/health/services/private-profile-service";

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

export default async function ProHealthDashboard() {
  const session = await auth();

  if (
    !session ||
    session.user?.userType !== "PROFESSIONAL" ||
    session.user?.industry !== "HEALTH"
  ) {
    redirect("/portal");
  }

  const professional = await getHealthProfessionalDashboardById(session.user.id);

  if (!professional) {
    redirect("/portal");
  }

  const displayName = professional.displayName || professional.name;

  return (
    <div className="min-h-screen bg-[#020617] text-white px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#0f172a]/80 p-8 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">
              Painel do Especialista
            </p>
            <h1 className="mt-3 text-3xl font-futura font-bold uppercase">
              {displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Gerencie sua agenda de atendimentos, confira os próximos pacientes
              e acompanhe seu posicionamento dentro do portal Health.
            </p>
          </div>
          <Link
            href={`/agendar-consulta/perfil/${professional.id}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#d73cbe]/30 bg-[#d73cbe]/10 px-5 py-3 text-sm font-semibold text-[#d73cbe] transition-colors hover:bg-[#d73cbe] hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Ver perfil público
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 p-6">
            <p className="text-sm text-slate-500">Consultas agendadas</p>
            <p className="mt-2 text-3xl font-bold">
              {professional.proAppointments.length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 p-6">
            <p className="text-sm text-slate-500">Sessão</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatCurrency(
                professional.consultationFee == null
                  ? null
                  : Number(professional.consultationFee),
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 p-6">
            <p className="text-sm text-slate-500">Avaliação</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              {professional.rating.toFixed(1)} ({professional.ratingCount})
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 p-6">
            <p className="text-sm text-slate-500">Atuação</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
              <MapPin className="h-4 w-4 text-[#d73cbe]" />
              {professional.city && professional.state
                ? `${professional.city}, ${professional.state}`
                : "Não informada"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-[#0f172a]/80 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-futura font-bold uppercase">
                Próximas consultas
              </h2>
              <p className="mt-2 text-slate-400">
                Lista inicial para você acompanhar o que já está marcado no
                portal.
              </p>
            </div>

            {professional.proAppointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
                <p className="text-slate-400">
                  Você ainda não possui consultas agendadas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {professional.proAppointments.map((appointment) => {
                  const patientName =
                    appointment.patient.displayName || appointment.patient.name;

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
                            {patientName}
                          </h3>
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
                              Abrir sala
                            </a>
                          )}
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-400">
                          <div className="mb-2 flex items-center gap-2 text-slate-300">
                            <ShieldCheck className="h-4 w-4 text-[#d73cbe]" />
                            Observações do paciente
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

          <div className="rounded-3xl border border-white/10 bg-[#0f172a]/80 p-8">
            <h2 className="text-2xl font-futura font-bold uppercase">
              Seu perfil clínico
            </h2>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-slate-500">Especialidade</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {professional.jobTitle || "Especialista"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-slate-500">Registro profissional</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {professional.documentReg || "Ainda não informado"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-slate-500">Abordagem</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {professional.approach || "Ainda não informada"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
