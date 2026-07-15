"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  ContactRound,
  ShieldCheck,
  Settings2,
  UserRound,
} from "lucide-react";
import type { HealthProfileCompletion } from "../lib/health-profile-completion";
import type { HealthProfessionalProfile } from "../types";
import { EditProProfileModal } from "./edit-pro-profile-modal";
import { EditScheduleModal } from "./edit-schedule-modal";
import { OPEN_HEALTH_SCHEDULE_MODAL } from "./schedule-config-link";

interface Props {
  professional: HealthProfessionalProfile;
  missingProfessionalIdentity: boolean;
  verificationApproved: boolean;
  specialtyOperational: boolean;
  profileCompletion: HealthProfileCompletion;
}

export function DashboardModalsController({
  professional,
  missingProfessionalIdentity,
  verificationApproved,
  specialtyOperational,
  profileCompletion,
}: Props) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const scheduleBlocked =
    missingProfessionalIdentity ||
    !verificationApproved ||
    !specialtyOperational;
  const bookingBlockingItems = profileCompletion.missingItems.filter((item) =>
    ["category", "identity", "fee", "session", "schedule"].includes(
      item.key,
    ),
  );

  useEffect(() => {
    const openScheduleModal = () => {
      if (!scheduleBlocked) setIsScheduleOpen(true);
    };

    window.addEventListener(OPEN_HEALTH_SCHEDULE_MODAL, openScheduleModal);
    return () =>
      window.removeEventListener(OPEN_HEALTH_SCHEDULE_MODAL, openScheduleModal);
  }, [scheduleBlocked]);

  return (
    <>
      {!verificationApproved && (
        <div className="mb-4 flex flex-col items-start gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 sm:flex-row sm:items-center">
          <div className="rounded-full bg-amber-500/15 p-3 text-amber-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-amber-300">
              Verificacao profissional necessaria
            </h3>
            <p className="mt-1 text-sm text-amber-100/70">
              Envie seus documentos para liberar agenda, perfil publico e novos atendimentos.
            </p>
          </div>
          <Link
            href="/agendar-consulta/verificacao"
            className="rounded-lg bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300"
          >
            Enviar documentos
          </Link>
        </div>
      )}

      {!specialtyOperational && (
        <div className="mb-4 rounded-xl border border-slate-500/30 bg-slate-500/10 p-5">
          <h3 className="font-bold text-slate-200">
            Categoria temporariamente indisponivel
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            A verificacao pode ser concluida, mas novos atendimentos de Advocacia permanecem bloqueados ate a liberacao regulatoria da MWC.
          </p>
        </div>
      )}

      {bookingBlockingItems.length > 0 && (
        <div className="mb-8 flex flex-col items-start gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] sm:flex-row sm:items-center">
          <div className="rounded-full bg-red-500/20 p-3 text-red-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold uppercase tracking-wide text-red-400">
              Perfil indisponivel para novos atendimentos
            </h3>
            <p className="mt-1 text-sm text-red-300/80">
              Complete os itens abaixo para aparecer na busca e receber
              agendamentos:
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {bookingBlockingItems.map((item) => (
                <li
                  key={item.key}
                  className="rounded-md border border-red-400/20 bg-red-950/30 px-2.5 py-1 text-xs font-semibold text-red-200"
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-4 grid items-stretch gap-3 md:grid-cols-2 lg:grid-cols-[auto_auto_minmax(0,1fr)]">
        <button
          onClick={() => setIsScheduleOpen(true)}
          disabled={scheduleBlocked}
          className={`flex min-h-24 w-full items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-sm font-bold transition-all active:scale-95 lg:w-56 ${
            scheduleBlocked
              ? "cursor-not-allowed bg-white/5 text-slate-500"
              : "cursor-pointer bg-[#d73cbe] text-white shadow-lg shadow-[#d73cbe]/20 hover:bg-[#b02da0]"
          }`}
        >
          <Settings2 className="h-5 w-5" /> Configurar Horarios
        </button>

        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="flex min-h-24 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#d73cbe]/25 bg-[#d73cbe]/10 px-8 py-3.5 text-sm font-bold text-[#d73cbe] transition-all hover:border-[#d73cbe]/45 hover:bg-[#d73cbe]/15 active:scale-95 lg:w-56"
        >
          <UserRound className="h-5 w-5" /> Editar perfil profissional
        </button>

        <section className="rounded-lg border border-white/10 bg-[#0f172a]/80 p-4 md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="font-semibold text-slate-300">
              Progresso do perfil
            </span>
            <strong
              className={
                profileCompletion.percent === 100
                  ? "text-emerald-400"
                  : "text-[#d73cbe]"
              }
            >
              {profileCompletion.percent}%
            </strong>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full transition-all ${
                profileCompletion.percent === 100
                  ? "bg-emerald-500"
                  : "bg-[#d73cbe]"
              }`}
              style={{ width: `${profileCompletion.percent}%` }}
            />
          </div>

          <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-500">
                {profileCompletion.done}/{profileCompletion.total} itens
              </span>
              <CompletionStatus
                complete={profileCompletion.sections.professional}
                label="Perfil"
              />
              <CompletionStatus
                complete={profileCompletion.sections.schedule}
                label="Agenda"
              />
              <CompletionStatus
                complete={profileCompletion.sections.personal}
                label="Dados pessoais"
              />
            </div>

            {profileCompletion.percent < 100 ? (
              <div className="flex flex-wrap gap-2">
                {!profileCompletion.sections.schedule &&
                  !scheduleBlocked && (
                    <button
                      onClick={() => setIsScheduleOpen(true)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-[#d73cbe]/40 hover:text-white"
                    >
                      <CalendarRange className="h-3.5 w-3.5" /> Agenda
                    </button>
                  )}
                {!profileCompletion.sections.personal && (
                  <Link
                    href="/agendar-consulta/meu-perfil"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-[#d73cbe]/40 hover:text-white"
                  >
                    <ContactRound className="h-3.5 w-3.5" /> Dados pessoais
                  </Link>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Perfil completo
              </div>
            )}
          </div>
        </section>
      </div>

      <EditProProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        initialData={professional}
      />
      <EditScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        professional={professional}
      />
    </>
  );
}

function CompletionStatus({
  complete,
  label,
}: {
  complete: boolean;
  label: string;
}) {
  return (
    <span
      className={`rounded-md border px-2 py-1 ${
        complete
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-white/10 bg-white/5 text-slate-500"
      }`}
    >
      {label}
    </span>
  );
}
