"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  ContactRound,
  FileWarning,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type {
  HealthOnboardingAction,
  HealthOnboardingStep,
  HealthOnboardingStepStatus,
  HealthProfileCompletion,
} from "../lib/health-profile-completion";
import type { HealthProfessionalProfile } from "../types";
import { EditProProfileModal } from "./edit-pro-profile-modal";
import { EditScheduleModal } from "./edit-schedule-modal";
import { OPEN_HEALTH_SCHEDULE_MODAL } from "./schedule-config-link";

interface Props {
  professional: HealthProfessionalProfile;
  specialtyOperational: boolean;
  profileCompletion: HealthProfileCompletion;
}

const statusLabel: Record<HealthOnboardingStepStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  UNDER_REVIEW: "Em analise",
  CHANGES_REQUIRED: "Ajustes solicitados",
  COMPLETED: "Concluida",
  BLOCKED: "Aguardando requisitos",
};

function actionLabel(step: HealthOnboardingStep) {
  if (step.status === "COMPLETED") return "Revisar";
  if (step.status === "UNDER_REVIEW") return "Acompanhar";
  if (step.status === "CHANGES_REQUIRED") return "Corrigir";
  return step.status === "IN_PROGRESS" ? "Continuar" : "Comecar";
}

export function DashboardModalsController({
  professional,
  specialtyOperational,
  profileCompletion,
}: Props) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const scheduleBlocked = !specialtyOperational;

  useEffect(() => {
    const openScheduleModal = () => {
      if (!scheduleBlocked) setIsScheduleOpen(true);
    };

    window.addEventListener(OPEN_HEALTH_SCHEDULE_MODAL, openScheduleModal);
    return () =>
      window.removeEventListener(OPEN_HEALTH_SCHEDULE_MODAL, openScheduleModal);
  }, [scheduleBlocked]);

  function runAction(action: HealthOnboardingAction) {
    if (action === "professional") setIsProfileOpen(true);
    if (action === "schedule" && !scheduleBlocked) setIsScheduleOpen(true);
  }

  const nextStep = profileCompletion.nextStep;

  return (
    <>
      {!specialtyOperational && (
        <div className="mb-4 rounded-xl border border-slate-500/30 bg-slate-500/10 p-5">
          <h3 className="font-bold text-slate-200">
            Categoria temporariamente indisponivel
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            O cadastro pode ser concluido, mas novos atendimentos permanecem
            bloqueados ate a liberacao regulatoria da MWC.
          </p>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]/90 shadow-2xl shadow-black/20">
        <div className="border-b border-white/10 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d73cbe]">
                Ativacao do perfil
              </p>
              <h2 className="mt-2 text-xl font-bold text-white">
                {profileCompletion.publicationComplete
                  ? "Seu perfil esta ativo"
                  : "Complete seu perfil para receber agendamentos"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Voce pode preencher as etapas em qualquer ordem. A agenda pode
                ser preparada desde ja, mas o perfil so sera publicado depois
                da aprovacao dos documentos e de todos os requisitos obrigatorios.
              </p>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <strong
                className={
                  profileCompletion.publicationComplete
                    ? "text-2xl text-emerald-400"
                    : "text-2xl text-[#d73cbe]"
                }
              >
                {profileCompletion.percent}%
              </strong>
              <p className="mt-1 text-xs text-slate-500">
                {profileCompletion.done}/{profileCompletion.total} requisitos
              </p>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full transition-all ${
                profileCompletion.publicationComplete
                  ? "bg-emerald-500"
                  : "bg-[#d73cbe]"
              }`}
              style={{ width: `${profileCompletion.percent}%` }}
            />
          </div>
        </div>

        <ol className="divide-y divide-white/5">
          {profileCompletion.steps.map((step, index) => (
            <li
              key={step.key}
              className="flex items-center gap-3 px-5 py-4 sm:px-6"
            >
              <StepIcon status={step.status} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {index + 1}.
                  </span>
                  <h3 className="text-sm font-bold text-slate-100">
                    {step.label}
                  </h3>
                  <StatusBadge status={step.status} />
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {step.description}
                </p>
              </div>
              {step.action && (
                <StepAction
                  step={step}
                  disabled={step.action === "schedule" && scheduleBlocked}
                  onAction={runAction}
                />
              )}
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-black/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs leading-5 text-slate-500">
            Endereco e opcional e nao interfere na ativacao do perfil Online.
          </p>
          {nextStep?.action ? (
            <PrimaryAction
              step={nextStep}
              disabled={nextStep.action === "schedule" && scheduleBlocked}
              onAction={runAction}
            />
          ) : (
            <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Cadastro concluido
            </span>
          )}
        </div>
      </section>

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

function StepIcon({ status }: { status: HealthOnboardingStepStatus }) {
  const className = "h-5 w-5 shrink-0";
  if (status === "COMPLETED") {
    return <CheckCircle2 className={`${className} text-emerald-400`} />;
  }
  if (status === "UNDER_REVIEW") {
    return <Clock3 className={`${className} text-blue-400`} />;
  }
  if (status === "CHANGES_REQUIRED") {
    return <FileWarning className={`${className} text-amber-400`} />;
  }
  if (status === "BLOCKED") {
    return <LockKeyhole className={`${className} text-slate-600`} />;
  }
  return <CircleDashed className={`${className} text-[#d73cbe]`} />;
}

function StatusBadge({ status }: { status: HealthOnboardingStepStatus }) {
  const colors =
    status === "COMPLETED"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
      : status === "UNDER_REVIEW"
        ? "border-blue-500/20 bg-blue-500/10 text-blue-300"
        : status === "CHANGES_REQUIRED"
          ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
          : "border-white/10 bg-white/5 text-slate-500";

  return (
    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${colors}`}>
      {statusLabel[status]}
    </span>
  );
}

function actionIcon(action: HealthOnboardingAction) {
  if (action === "personal") return <ContactRound className="h-4 w-4" />;
  if (action === "professional") return <UserRound className="h-4 w-4" />;
  if (action === "verification") return <ShieldCheck className="h-4 w-4" />;
  return <CalendarRange className="h-4 w-4" />;
}

function actionHref(action: HealthOnboardingAction) {
  if (action === "personal") return "/agendar-consulta/meu-perfil";
  if (action === "verification") return "/agendar-consulta/verificacao";
  return null;
}

function StepAction({
  step,
  disabled,
  onAction,
}: {
  step: HealthOnboardingStep;
  disabled: boolean;
  onAction: (action: HealthOnboardingAction) => void;
}) {
  const action = step.action;
  if (!action) return null;
  const href = actionHref(action);
  const classes =
    "hidden items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-[#d73cbe]/40 hover:text-white sm:inline-flex";

  if (href) {
    return (
      <Link href={href} className={classes}>
        {actionLabel(step)} <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAction(action)}
      className={`${classes} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {actionLabel(step)} <ChevronRight className="h-3.5 w-3.5" />
    </button>
  );
}

function PrimaryAction({
  step,
  disabled,
  onAction,
}: {
  step: HealthOnboardingStep;
  disabled: boolean;
  onAction: (action: HealthOnboardingAction) => void;
}) {
  const action = step.action;
  if (!action) return null;
  const href = actionHref(action);
  const content = (
    <>
      {actionIcon(action)}
      {step.status === "UNDER_REVIEW"
        ? "Acompanhar analise"
        : "Continuar cadastro"}
      <ChevronRight className="h-4 w-4" />
    </>
  );
  const classes =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-[#d73cbe] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#b02da0]";

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAction(action)}
      className={`${classes} disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400`}
    >
      {content}
    </button>
  );
}
