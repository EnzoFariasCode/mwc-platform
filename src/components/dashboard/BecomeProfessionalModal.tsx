"use client";

import { X, Briefcase, CheckCircle2, Zap } from "lucide-react";

interface BecomeProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function BecomeProfessionalModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: BecomeProfessionalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-[#d73cbe]/30 rounded-2xl w-full max-w-md shadow-2xl shadow-purple-900/20 overflow-hidden animate-slide-up relative">
        {/* Fundo Decorativo */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-[#d73cbe] to-blue-500" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-[#d73cbe]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#d73cbe]/20">
            <Zap className="w-8 h-8 text-[#d73cbe]" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 font-futura">
            Ativar Modo Profissional?
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Ao ativar este modo, você poderá oferecer seus serviços, enviar
            propostas e ser encontrado por milhares de clientes.
          </p>

          <div className="space-y-3 mb-8 text-left bg-slate-900/50 p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <span>Crie um perfil público personalizado</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <span>Envie propostas ilimitadas</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <span>Receba pagamentos pela plataforma</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? "Ativando..." : "Confirmar e Ativar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
