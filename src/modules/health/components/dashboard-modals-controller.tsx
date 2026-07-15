"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Settings2 } from "lucide-react";
import type { HealthProfessionalProfile } from "../types";
import { EditProProfileModal } from "./edit-pro-profile-modal";
import { EditScheduleModal } from "./edit-schedule-modal";
import { OPEN_HEALTH_SCHEDULE_MODAL } from "./schedule-config-link";

interface Props {
  professional: HealthProfessionalProfile;
  missingProfessionalIdentity: boolean;
}

export function DashboardModalsController({
  professional,
  missingProfessionalIdentity,
}: Props) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const isTeacher = professional.onlineSpecialty === "TEACHER";

  useEffect(() => {
    const openScheduleModal = () => {
      if (!missingProfessionalIdentity) setIsScheduleOpen(true);
    };

    window.addEventListener(OPEN_HEALTH_SCHEDULE_MODAL, openScheduleModal);
    return () =>
      window.removeEventListener(OPEN_HEALTH_SCHEDULE_MODAL, openScheduleModal);
  }, [missingProfessionalIdentity]);

  return (
    <>
      {missingProfessionalIdentity && (
        <div className="mb-8 flex flex-col items-start gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] sm:flex-row sm:items-center">
          <div className="rounded-full bg-red-500/20 p-3 text-red-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold uppercase tracking-wide text-red-400">
              Seu perfil esta incompleto
            </h3>
            <p className="mt-1 text-sm text-red-300/80">
              {isTeacher
                ? "Informe sua materia ou area de ensino para aparecer aos alunos."
                : "Informe seu registro profissional para aparecer aos clientes."}
            </p>
          </div>
          <button
            onClick={() => setIsProfileOpen(true)}
            className="cursor-pointer whitespace-nowrap rounded-lg bg-red-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-red-600 active:scale-95"
          >
            Completar Perfil Agora
          </button>
        </div>
      )}

      <button
        onClick={() => setIsScheduleOpen(true)}
        disabled={missingProfessionalIdentity}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-sm font-bold transition-all active:scale-95 sm:w-fit ${
          missingProfessionalIdentity
            ? "cursor-not-allowed bg-white/5 text-slate-500"
            : "cursor-pointer bg-[#d73cbe] text-white shadow-lg shadow-[#d73cbe]/20 hover:bg-[#b02da0]"
        }`}
      >
        <Settings2 className="h-5 w-5" /> Configurar Horarios
      </button>

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
