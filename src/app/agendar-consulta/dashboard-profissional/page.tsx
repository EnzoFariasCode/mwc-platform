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
  AlertTriangle,
  CalendarRange,
  Settings2,
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

  // IMPORTANTE: Certifique-se de que este service está trazendo os campos novos (documentReg, approach, sessionDuration, etc)
  const professional = await getHealthProfessionalDashboardById(
    session.user.id,
  );

  if (!professional) {
    redirect("/portal");
  }

  const displayName = professional.displayName || professional.name;

  // TRAVA DE SEGURANÇA (Regra de Negócio)
  const missingCredential = !professional.documentReg;
  const missingApproach = !professional.approach;

  return (
    <div className="min-h-screen bg-[#020617] text-white px-4 py-10 selection:bg-[#d73cbe]/30 font-sans">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* =========================================
            ALERTA CRÍTICO DE CREDENCIAL INCOMPLETA 
            ========================================= */}
        {missingCredential && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <div className="rounded-full bg-red-500/20 p-3 text-red-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-400 uppercase tracking-wide">
                Seu perfil está invisível para os pacientes!
              </h3>
              <p className="text-sm text-red-300/80 mt-1">
                Para começar a receber agendamentos, é obrigatório informar o
                seu Registro Profissional (Ex: CRM, CRP).
              </p>
            </div>
            {/* Esse botão chamará o Modal da Fase 3 */}
            <button className="whitespace-nowrap rounded-xl bg-red-500 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-red-600 shadow-lg shadow-red-500/20">
              Completar Perfil Agora
            </button>
          </div>
        )}

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
              <p className="text-sm text-slate-400">Agendamentos Realizados</p>
              <p className="mt-1 text-3xl font-bold text-white leading-none">
                {/* Aqui estamos filtrando as completadas (se você já tiver isso mapeado, caso contrário usa o tamanho do array por enquanto) */}
                {professional.proAppointments?.length || 0}
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
                  {(professional.rating || 0).toFixed(1)}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Avaliação média</p>
              <p className="mt-1 text-2xl font-bold text-white leading-none">
                {professional.ratingCount || 0}{" "}
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
                <Video className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Local
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Atuação exclusiva</p>
              <p className="mt-1 text-lg font-bold text-[#d73cbe] truncate leading-tight">
                Telemedicina (Meet)
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Coluna Esquerda: Consultas */}
          <div className="rounded-3xl border border-white/10 bg-[#0f172a]/80 p-8 backdrop-blur-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold uppercase tracking-tight">
                Próximas consultas
              </h2>
              <p className="mt-1 text-slate-400">
                Lista de atendimentos agendados via portal.
              </p>
            </div>

            {!professional.proAppointments ||
            professional.proAppointments.length === 0 ? (
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
                {professional.proAppointments.map((appointment: any) => {
                  const patientName =
                    appointment.patient?.displayName ||
                    appointment.patient?.name ||
                    "Paciente Oculto";

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

          {/* Coluna Direita: Perfil Clínico e Gestão de Agenda */}
          <div className="space-y-6">
            {/* GESTÃO DE AGENDA (A NOVA ÁREA!) */}
            <div className="rounded-3xl border border-[#d73cbe]/20 bg-[#d73cbe]/5 p-8 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 bg-[#d73cbe]/20 blur-3xl w-24 h-24 rounded-full pointer-events-none"></div>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#d73cbe]/20 text-[#d73cbe] rounded-lg">
                  <CalendarRange className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">
                  Sua Agenda
                </h2>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                  <span className="text-slate-400">Duração da sessão</span>
                  <span className="font-bold text-white">
                    {professional.sessionDuration || 50} minutos
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                  <span className="text-slate-400">Disponibilidade</span>
                  <span className="font-bold text-white">Não configurada</span>
                </div>
              </div>

              {/* Esse botão chamará o Modal da Agenda (Fase 3) */}
              <button
                disabled={missingCredential}
                className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${missingCredential ? "bg-white/5 text-slate-500 cursor-not-allowed" : "bg-[#d73cbe] hover:bg-[#b02da0] text-white shadow-lg shadow-[#d73cbe]/20"}`}
              >
                <Settings2 className="w-4 h-4" /> Configurar Horários
              </button>
              {missingCredential && (
                <p className="text-[10px] text-center text-red-400 mt-3">
                  Preencha seu registro profissional para liberar a agenda.
                </p>
              )}
            </div>

            {/* PERFIL CLÍNICO */}
            <div className="rounded-3xl border border-white/10 bg-[#0f172a]/80 p-8 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold uppercase tracking-tight">
                  Perfil Clínico
                </h2>
                {/* Esse botão chamará o Modal de Edição (Fase 3) */}
                <button className="text-xs text-[#d73cbe] hover:underline font-bold uppercase tracking-wider">
                  Editar
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Especialidade
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {professional.jobTitle || "Não informado"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    Registro Profissional
                    {missingCredential && (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    )}
                  </p>
                  <p
                    className={`mt-2 text-lg font-semibold font-mono ${missingCredential ? "text-red-400" : "text-white"}`}
                  >
                    {professional.documentReg || "Pendente"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    Abordagem Clínica
                    {missingApproach && (
                      <AlertTriangle className="w-3 h-3 text-yellow-500" />
                    )}
                  </p>
                  <p
                    className={`mt-2 text-lg font-semibold ${missingApproach ? "text-yellow-400/80" : "text-white"}`}
                  >
                    {professional.approach || "Pendente"}
                  </p>
                  {missingApproach && (
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                      Ex: Terapia Cognitivo-Comportamental, Psicanálise, etc.
                      Isso ajuda pacientes a te encontrarem.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
