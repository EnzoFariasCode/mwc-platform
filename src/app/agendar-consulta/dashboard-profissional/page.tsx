import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ExternalLink,
  Star,
  Video,
  Users,
  Banknote,
  AlertTriangle,
  CalendarRange,
} from "lucide-react";
import { getHealthProfessionalDashboardById } from "@/modules/health/services/private-profile-service";
import { DashboardModalsController } from "@/modules/health/components/dashboard-modals-controller";
import { ProfessionalAppointmentsTabs } from "@/modules/health/components/professional-appointments-tabs";

// Funções Utilitárias de Formatação
function formatCurrency(value: number | null) {
  if (value == null) return "A combinar";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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

  // TRAVA DE SEGURANÇA (Regra de Negócio)
  const missingCredential = !professional.documentReg;
  const missingApproach = !professional.approach;
  const appointmentItems = (professional.proAppointments ?? []).map(
    (appointment) => ({
      id: appointment.id,
      date: appointment.date.toISOString(),
      time: appointment.time,
      status: appointment.status,
      price: Number(appointment.price),
      meetLink: appointment.meetLink,
      notes: appointment.notes,
      patientName:
        appointment.patient?.displayName ||
        appointment.patient?.name ||
        "Paciente Oculto",
    }),
  );

  return (
    // A FONTE POPPINS ESTÁ AQUI NA PRIMEIRA DIV 👇
    <div className="min-h-screen bg-[#020617] text-white px-4 py-10 selection:bg-[#d73cbe]/30 font-poppins">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* =========================================
            CONTROLADOR DE MODAIS E BOTÕES
            (Ele cuida do alerta vermelho e dos botões mágicos)
            ========================================= */}
        <DashboardModalsController
          professional={professional}
          missingCredential={missingCredential}
        />

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
              e acompanhe seu posicionamento dentro do portal MWC Online.
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
                {professional.proAppointments?.length || 0}
              </p>
            </div>
          </div>

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
          <ProfessionalAppointmentsTabs appointments={appointmentItems} />

          {/* Coluna Direita: Perfil Clínico e Gestão de Agenda */}
          <div className="space-y-6">
            {/* GESTÃO DE AGENDA INFO */}
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
                  <span className="font-bold text-white">Ver config.</span>
                </div>
              </div>
              {/* O Botão de Agenda está no DashboardModalsController logo acima do Perfil! */}
            </div>

            {/* PERFIL CLÍNICO */}
            <div className="rounded-3xl border border-white/10 bg-[#0f172a]/80 p-8 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold uppercase tracking-tight">
                  Perfil Clínico
                </h2>
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
