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
  Users,
  Banknote,
} from "lucide-react";
import { getHealthProfessionalDashboardById } from "@/modules/health/services/private-profile-service";

// Funções Utilitárias de Formatação
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

  // Verificação de autenticação e permissão
  if (
    !session ||
    session.user?.userType !== "PROFESSIONAL" ||
    session.user?.industry !== "HEALTH"
  ) {
    redirect("/portal");
  }

  const professional = await getHealthProfessionalDashboardById(
    session.user.id,
  );

  if (!professional) {
    redirect("/portal");
  }

  const displayName = professional.displayName || professional.name;

  return (
    <div className="min-h-screen bg-[#020617] text-white px-4 py-10 selection:bg-[#d73cbe]/30 font-sans">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header de Boas-vindas */}
        <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-[#0f172a]/80 p-8 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500 font-medium">
              Painel do Especialista
            </p>
            <h1 className="mt-3 text-3xl font-bold uppercase tracking-tight">
              {displayName}
            </h1>
            <p className="mt-2 max-w-2xl text-slate-400 leading-relaxed">
              Gerencie sua agenda de atendimentos, confira os próximos pacientes
              e acompanhe seu posicionamento dentro do portal Health.
            </p>
          </div>
          <Link
            href={`/agendar-consulta/perfil/${professional.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d73cbe]/30 bg-[#d73cbe]/10 px-6 py-4 text-sm font-semibold text-[#d73cbe] transition-all hover:bg-[#d73cbe] hover:text-white active:scale-95"
          >
            <ExternalLink className="h-4 w-4" />
            Ver perfil público
          </Link>
        </div>

        {/* Grid de Métricas */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card: Consultas */}
          <div className="group rounded-2xl border border-white/10 bg-[#0f172a]/70 p-6 transition-all hover:border-[#d73cbe]/30">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Total
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Agendamentos</p>
              <p className="mt-1 text-3xl font-bold text-white leading-none">
                {professional.proAppointments.length}
              </p>
            </div>
          </div>

          {/* Card: Valor Sessão */}
          <div className="group rounded-2xl border border-white/10 bg-[#0f172a]/70 p-6 transition-all hover:border-[#d73cbe]/30">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                <Banknote className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Sessão
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Valor base</p>
              <p className="mt-1 text-2xl font-bold text-white leading-none">
                {formatCurrency(
                  professional.consultationFee == null
                    ? null
                    : Number(professional.consultationFee),
                )}
              </p>
            </div>
          </div>

          {/* Card: Avaliação */}
          <div className="group rounded-2xl border border-white/10 bg-[#0f172a]/70 p-6 transition-all hover:border-[#d73cbe]/30">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-yellow-500/10 p-2 text-yellow-500 group-hover:bg-yellow-500/20 transition-colors">
                <Star className="h-5 w-5 fill-yellow-500/20" />
              </div>
              <div className="flex items-center gap-1 text-yellow-500">
                <span className="text-sm font-bold">
                  {professional.rating.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Avaliação média</p>
              <p className="mt-1 text-2xl font-bold text-white leading-none">
                {professional.ratingCount}{" "}
                <span className="text-xs font-normal text-slate-500">
                  feedbacks
                </span>
              </p>
            </div>
          </div>

          {/* Card: Localização */}
          <div className="group rounded-2xl border border-white/10 bg-[#0f172a]/70 p-6 transition-all hover:border-[#d73cbe]/30">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-[#d73cbe]/10 p-2 text-[#d73cbe] group-hover:bg-[#d73cbe]/20 transition-colors">
                <MapPin className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Local
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Atuação atual</p>
              <p className="mt-1 text-lg font-bold text-white truncate leading-tight">
                {professional.city && professional.state
                  ? `${professional.city}, ${professional.state}`
                  : "Não informada"}
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Coluna: Consultas */}
          <div className="rounded-3xl border border-white/10 bg-[#0f172a]/80 p-8 backdrop-blur-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold uppercase tracking-tight">
                Próximas consultas
              </h2>
              <p className="mt-1 text-slate-400">
                Lista de atendimentos agendados via portal.
              </p>
            </div>

            {professional.proAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-20 text-center">
                <div className="rounded-full bg-white/5 p-4 mb-4">
                  <CalendarClock className="h-8 w-8 text-slate-600" />
                </div>
                <p className="text-slate-400">
                  Nenhuma consulta agendada no momento.
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
                      className="group relative rounded-2xl border border-white/5 bg-[#020617]/70 p-5 transition-all hover:border-[#d73cbe]/20 hover:bg-[#020617]"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <span className="inline-block rounded-full bg-[#d73cbe]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#d73cbe] border border-[#d73cbe]/20">
                            {appointment.status}
                          </span>
                          <h3 className="text-xl font-semibold text-white group-hover:text-[#d73cbe] transition-colors">
                            {patientName}
                          </h3>
                        </div>

                        <div className="grid gap-3 text-sm text-slate-300 md:text-right">
                          <p className="flex items-center gap-2 md:justify-end">
                            <CalendarClock className="h-4 w-4 text-slate-500" />
                            {formatDate(appointment.date)}
                          </p>
                          <p className="flex items-center gap-2 md:justify-end">
                            <Clock3 className="h-4 w-4 text-slate-500" />
                            {formatCurrency(Number(appointment.price))}
                          </p>
                          {appointment.meetLink && (
                            <a
                              href={appointment.meetLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 font-medium text-[#d73cbe] hover:text-white transition-colors md:justify-end"
                            >
                              <Video className="h-4 w-4" />
                              Entrar na sala de atendimento
                            </a>
                          )}
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-slate-400">
                          <div className="mb-2 flex items-center gap-2 text-slate-300 font-medium">
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

          {/* Coluna: Perfil Clínico */}
          <div className="rounded-3xl border border-white/10 bg-[#0f172a]/80 p-8 backdrop-blur-sm h-fit">
            <h2 className="text-2xl font-bold uppercase tracking-tight">
              Perfil clínico
            </h2>
            <div className="mt-8 space-y-4 text-sm">
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Especialidade
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {professional.jobTitle || "Especialista"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Registro profissional
                </p>
                <p className="mt-2 text-lg font-semibold text-white font-mono">
                  {professional.documentReg || "Ainda não informado"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Abordagem clínica
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {professional.approach || "Ainda não informada"}
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-[#d73cbe]/10 to-transparent border border-[#d73cbe]/10">
              <p className="text-xs text-slate-400 leading-relaxed">
                Mantenha seus dados atualizados para transmitir mais confiança
                aos pacientes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
