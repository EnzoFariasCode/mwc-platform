"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import {
  X,
  Save,
  AlignLeft,
  GraduationCap,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
// Importando a Server Action que criamos na etapa anterior
import { updateHealthProProfile } from "../actions/update-health-pro";
import type { HealthProfessionalProfile } from "../types";

type EditProProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: HealthProfessionalProfile | null;
};

export function EditProProfileModal({
  isOpen,
  onClose,
  initialData,
}: EditProProfileModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const initialFee =
    typeof initialData?.consultationFee === "number" ||
    typeof initialData?.consultationFee === "string"
      ? initialData.consultationFee
      : 150;
  const isTeacher = initialData?.onlineSpecialty === "TEACHER";

  // Lógica real conectada ao Back-end
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Captura todos os inputs que possuem o atributo "name"
    const formData = new FormData(e.currentTarget);
    const result = await updateHealthProProfile(formData);

    setIsSaving(false);

    if (result?.error) {
      setError(result.error);
    } else {
      onClose(); // Fecha o modal com sucesso
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Trocamos a div principal do conteúdo por um form */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 custom-scrollbar"
      >
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4 sticky top-0 bg-[#0f172a] z-10">
          <div>
            <h2 className="text-2xl font-futura font-bold text-white">
              Editar Perfil Profissional
            </h2>
            <p className="text-sm text-slate-400">
                Essas informações aparecerão no seu perfil público para os
                clientes.
            </p>
          </div>
          <button
            type="button" // Importante para não submeter o form sem querer
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-400 cursor-pointer border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALERTA DE ERRO DO BACK-END (Caso ocorra) */}
        {error && (
          <div className="mb-6 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

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
                  name="displayName" // Adicionado
                  type="text"
                  defaultValue={
                    initialData?.displayName || initialData?.name || ""
                  }
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  {isTeacher
                    ? "Categoria"
                    : "Titulo Profissional (Ex: Psicologo Clinico)"}
                </label>
                <input
                  name="jobTitle" // Adicionado
                  type="text"
                  readOnly={isTeacher}
                  defaultValue={isTeacher ? "Professor" : initialData?.jobTitle || ""}
                  placeholder="Ex: Médico Psiquiatra"
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                />
              </div>
              {isTeacher && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                    Materia ou area de ensino *
                  </label>
                  <input
                    name="teachingSubject"
                    type="text"
                    required
                    maxLength={100}
                    list="teaching-subject-suggestions"
                    defaultValue={initialData?.teachingSubject || ""}
                    placeholder="Ex: Ingles, Portugues, Matematica, Fisica..."
                    className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                  />
                  <datalist id="teaching-subject-suggestions">
                    <option value="Ingles" />
                    <option value="Portugues" />
                    <option value="Matematica" />
                    <option value="Fisica" />
                    <option value="Quimica" />
                    <option value="Historia" />
                    <option value="Musica" />
                  </datalist>
                  <p className="text-xs text-slate-500">
                    Essa especialidade sera exibida aos alunos no seu perfil.
                  </p>
                </div>
              )}
              <div
                className={`space-y-1.5 md:col-span-2 ${isTeacher ? "hidden" : ""}`}
              >
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Registro profissional
                </label>
                <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#020617] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {initialData?.documentReg || "Aguardando verificacao"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      O registro somente pode ser alterado pelo processo documental.
                    </p>
                  </div>
                  <Link
                    href="/agendar-consulta/verificacao"
                    onClick={onClose}
                    className="text-xs font-bold text-[#d73cbe] hover:text-white"
                  >
                    Gerenciar verificacao
                  </Link>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Forma de atuacao
                </label>
                <input
                  name="approach" // Adicionado
                  type="text"
                  defaultValue={initialData?.approach || ""}
                  placeholder={
                    isTeacher
                      ? "Ex: aulas praticas, reforco e resolucao de exercicios"
                      : "Descreva sua especialidade e forma de trabalho"
                  }
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
                  Valor do atendimento (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-500 text-sm">
                    R$
                  </span>
                  <input
                    name="consultationFee" // Adicionado
                    type="number"
                    step="0.01" // Permite centavos
                    defaultValue={initialFee}
                    className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Duração média (minutos)
                </label>
                <select
                  name="sessionDuration" // Adicionado
                  defaultValue={initialData?.sessionDuration || 50}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="30">30 minutos</option>
                  <option value="50">50 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1 hora e 30 min</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Fuso horário
                </label>
                <select
                  name="timezone"
                  defaultValue={initialData?.timezone || "America/Sao_Paulo"}
                  className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="America/Noronha">Fernando de Noronha</option>
                  <option value="America/Sao_Paulo">Brasília</option>
                  <option value="America/Cuiaba">Cuiabá</option>
                  <option value="America/Manaus">Manaus</option>
                  <option value="America/Rio_Branco">Rio Branco</option>
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
                name="bio" // Adicionado
                rows={6}
                defaultValue={initialData?.bio || ""}
                placeholder="Conte sobre sua formação, experiência e como você ajuda seus clientes..."
                className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#d73cbe] outline-none transition-all resize-none custom-scrollbar"
              />
            </div>
          </section>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 mt-10 border-t border-white/5">
          <button
            type="button" // Previne envio do form
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-3 text-white text-sm font-bold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit" // Agora é um submit de verdade!
            disabled={isSaving}
            className="px-8 py-3 bg-[#d73cbe] hover:bg-[#b02da0] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
      </form>
    </div>
  );
}
