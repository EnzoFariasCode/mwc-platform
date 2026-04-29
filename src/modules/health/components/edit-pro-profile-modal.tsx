"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Briefcase,
  FileText,
  DollarSign,
  X,
  Save,
  AlignLeft,
  GraduationCap,
} from "lucide-react";

type EditProProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
};

export function EditProProfileModal({
  isOpen,
  onClose,
  initialData,
}: EditProProfileModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4 sticky top-0 bg-[#0f172a] z-10">
          <div>
            <h2 className="text-2xl font-futura font-bold text-white">
              Editar Perfil Profissional
            </h2>
            <p className="text-sm text-slate-400">
              Essas informações aparecerão na sua vitrine pública para os
              pacientes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-400 cursor-pointer border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-10">
          {/* SEÇÃO 1: IDENTIFICAÇÃO E CREDENCIAIS */}
          <section>
            <h3 className="text-[#d73cbe] text-sm font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Credenciais e Identidade
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  defaultValue={initialData?.name || "Dr. Carlos Eduardo"}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Título Profissional (Ex: Psicólogo Clínico)
                </label>
                <input
                  type="text"
                  defaultValue={initialData?.jobTitle || ""}
                  placeholder="Ex: Médico Psiquiatra"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Registro (CRM / CRP / RMS)
                </label>
                <input
                  type="text"
                  defaultValue={initialData?.documentReg || ""}
                  placeholder="Ex: CRP 06/12345"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Abordagem / Especialidade principal
                </label>
                <input
                  type="text"
                  defaultValue={initialData?.approach || ""}
                  placeholder="Ex: Terapia Cognitivo-Comportamental"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* SEÇÃO 2: CONSULTA E VALORES */}
          <section>
            <h3 className="text-[#d73cbe] text-sm font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Configurações de Atendimento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Valor da Sessão (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-500 text-sm">
                    R$
                  </span>
                  <input
                    type="number"
                    defaultValue={initialData?.consultationFee || 150}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Duração média (minutos)
                </label>
                <select className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all appearance-none cursor-pointer">
                  <option value="30">30 minutos</option>
                  <option value="50">50 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1 hora e 30 min</option>
                </select>
              </div>
            </div>
          </section>

          {/* SEÇÃO 3: BIOGRAFIA EXPANDIDA */}
          <section>
            <h3 className="text-[#d73cbe] text-sm font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
              <AlignLeft className="w-4 h-4" /> Sobre Você (Bio)
            </h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                Descrição detalhada
              </label>
              <textarea
                rows={6}
                defaultValue={initialData?.bio || ""}
                placeholder="Conte sobre sua formação, experiência e como você ajuda seus pacientes..."
                className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all resize-none custom-scrollbar"
              />
            </div>
          </section>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 mt-10 border-t border-white/5">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-3 text-white text-sm font-bold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-[#d73cbe] hover:bg-[#b02da0] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
          >
            {isSaving ? (
              "Salvando..."
            ) : (
              <>
                <Save className="w-4 h-4" /> Salvar Perfil Profissional
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
