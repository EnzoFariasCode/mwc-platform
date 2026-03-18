/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { X, User, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CompleteProfileModal({
  isOpen,
  onClose,
}: CompleteProfileModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 300); // Espera animação
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden transition-all duration-300 transform ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-10"
        }`}
      >
        {/* Decorativo Topo */}
        <div className="h-2 w-full bg-gradient-to-r from-[#d73cbe] to-indigo-600" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-[#d73cbe]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#d73cbe]/20 text-[#d73cbe]">
            <User size={32} />
          </div>

          <h2 className="text-xl font-bold text-white font-futura mb-3">
            Complete seu Perfil
          </h2>

          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Para encontrar os melhores profissionais próximos a você, precisamos
            saber sua localização e alguns detalhes. É rapidinho!
          </p>

          <div className="bg-slate-950/50 rounded-xl p-4 mb-6 border border-white/5 text-left space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                <MapPin size={12} />
              </div>
              <span>Adicionar Cidade e Estado</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                <User size={12} />
              </div>
              <span>Adicionar uma Biografia curta</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-slate-400 hover:text-white font-bold text-sm transition-colors"
            >
              Fazer depois
            </button>
            <Link href="/dashboard/perfil" className="flex-1">
              <button className="w-full py-3 bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2 text-sm">
                Ir para Perfil <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
