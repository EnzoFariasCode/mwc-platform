"use client";

import { useState } from "react";
import { Settings2, AlertTriangle } from "lucide-react";
import { EditProProfileModal } from "./edit-pro-profile-modal";
import { EditScheduleModal } from "./edit-schedule-modal";

interface Props {
  professional: any;
  missingCredential: boolean;
}

export function DashboardModalsController({
  professional,
  missingCredential,
}: Props) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  return (
    <>
      {/* Botões que substituem os estáticos na sua page.tsx */}

      {/* BOTÃO 1: O Botão Vermelho Gigante do Topo (só renderiza se faltar credencial) */}
      {missingCredential && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] mb-8">
          <div className="rounded-full bg-red-500/20 p-3 text-red-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-400 uppercase tracking-wide">
              Seu perfil está invisível para os pacientes!
            </h3>
            <p className="text-sm text-red-300/80 mt-1">
              Para começar a receber agendamentos, informe seu Registro
              Profissional.
            </p>
          </div>
          <button
            onClick={() => setIsProfileOpen(true)}
            className="whitespace-nowrap rounded-xl bg-red-500 px-6 py-3 text-sm font-bold text-white hover:bg-red-600 shadow-lg"
          >
            Completar Perfil Agora
          </button>
        </div>
      )}

      {/* BOTÃO 2: Configurar Agenda */}
      <button
        onClick={() => setIsScheduleOpen(true)}
        disabled={missingCredential}
        className={`w-full py-3.5 mt-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${missingCredential ? "bg-white/5 text-slate-500 cursor-not-allowed" : "bg-[#d73cbe] hover:bg-[#b02da0] text-white shadow-lg shadow-[#d73cbe]/20"}`}
      >
        <Settings2 className="w-4 h-4" /> Configurar Horários
      </button>

      {/* Renderização Invisível dos Modais */}
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
