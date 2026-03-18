"use client";

import {
  X,
  Briefcase,
  CheckCircle2,
  Zap,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BecomeProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { jobTitle: string; yearsOfExperience: number }) => void;
  isLoading: boolean;
  userType?: "CLIENT" | "PROFESSIONAL" | "ADMIN" | string | null; // Adicionado para verificação
}

export function BecomeProfessionalModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  userType,
}: BecomeProfessionalModalProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [experience, setExperience] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!jobTitle.trim()) {
      toast.error("Por favor, informe sua especialidade.");
      return;
    }
    if (!experience) {
      toast.error("Por favor, informe seu tempo de experiência.");
      return;
    }

    onConfirm({
      jobTitle: jobTitle.trim(),
      yearsOfExperience: parseInt(experience),
    });
  };

  const isAlreadyProfessional = userType === "PROFESSIONAL";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-[#d73cbe]/30 rounded-2xl w-full max-w-md shadow-2xl shadow-purple-900/20 overflow-hidden animate-slide-up relative">
        {/* Fundo Decorativo Superior */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-[#d73cbe] to-blue-500" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {isAlreadyProfessional ? (
            // === ESTADO: JÁ É PROFISSIONAL ===
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-3 font-futura">
                Você já é Profissional
              </h2>

              <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-[280px]">
                Sua conta já possui todas as permissões para enviar propostas e
                gerenciar projetos.
              </p>

              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-600"
              >
                Entendido, fechar
              </button>
            </div>
          ) : (
            // === ESTADO: FORMULÁRIO DE ATIVAÇÃO ===
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#d73cbe]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#d73cbe]/20">
                  <Zap className="w-8 h-8 text-[#d73cbe]" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 font-futura">
                  Ativar Modo Profissional
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Complete seu perfil profissional para começar a receber
                  propostas.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {/* Campo Profissão */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">
                    Qual sua especialidade principal?
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#d73cbe] transition-colors">
                      <Briefcase size={18} />
                    </div>
                    <input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      type="text"
                      placeholder="Ex: Eletricista, Advogado, Dev..."
                      className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe]/50 transition-all placeholder:text-slate-600 text-sm"
                    />
                  </div>
                </div>

                {/* Campo Experiência */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">
                    Tempo de experiência
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#d73cbe] transition-colors pointer-events-none">
                      <Clock size={18} />
                    </div>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe]/50 transition-all text-sm appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="text-slate-500">
                        Selecione...
                      </option>
                      <option value="0">Menos de 1 ano</option>
                      <option value="2">Entre 1 a 3 anos</option>
                      <option value="5">Entre 3 a 5 anos</option>
                      <option value="8">Mais de 5 anos</option>
                      <option value="12">Mais de 10 anos</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Vantagens (Resumidas) */}
              <div className="bg-slate-900/30 p-3 rounded-xl border border-white/5 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
                  <CheckCircle2 className="w-3 h-3 text-green-400" /> Perfil
                  Público
                  <span className="w-1 h-1 bg-slate-700 rounded-full" />
                  <CheckCircle2 className="w-3 h-3 text-green-400" /> Propostas
                  Ilimitadas
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 disabled:opacity-70 flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {isLoading ? "Ativando..." : "Confirmar e Ativar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
