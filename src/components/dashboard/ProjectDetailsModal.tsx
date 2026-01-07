"use client";

import { X, Calendar, DollarSign, User, Clock, FileText } from "lucide-react";
import { useEffect } from "react";

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any; // Tipagem frouxa por enquanto, pois estamos usando mocks
}

export function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
}: ProjectDetailsModalProps) {
  // Fecha com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-950 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider border border-white/10 px-2 py-0.5 rounded-full">
                #{project.id.toString().padStart(4, "0")}
              </span>
              {/* Badge de Status (Reutilizando lógica simples) */}
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase">
                Em Andamento
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white font-futura leading-tight">
              {project.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
          {/* 1. O Profissional (Quem aceitou) */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Profissional Contratado
            </h3>
            <div className="bg-slate-900 border border-white/5 p-4 rounded-xl flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full ${project.professional.color} flex items-center justify-center text-white font-bold text-lg border border-white/10 shrink-0`}
              >
                {project.professional.avatarInitials}
              </div>
              <div>
                <p className="text-white font-bold text-lg">
                  {project.professional.name}
                </p>
                <p className="text-slate-400 text-sm">
                  {project.professional.role}
                </p>
              </div>
              <div className="ml-auto hidden md:block text-right">
                <p className="text-xs text-slate-500">Aceitou o projeto em</p>
                <p className="text-slate-300 font-medium text-sm">
                  {project.startDate}
                </p>
              </div>
            </div>
          </section>

          {/* 2. Resumo/Descrição */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Escopo do Projeto
            </h3>
            <div className="text-slate-300 text-sm leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-white/5">
              {project.description}
            </div>
          </section>

          {/* 3. Dados do Contrato (Grid) */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Detalhes do Contrato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Data Inicio */}
              <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-slate-500 mb-2 text-xs">
                  <Calendar className="w-4 h-4" /> Data de Aceite
                </div>
                <p className="text-white font-bold">{project.startDate}</p>
              </div>

              {/* Prazo */}
              <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-slate-500 mb-2 text-xs">
                  <Clock className="w-4 h-4" /> Prazo Final
                </div>
                <p className="text-white font-bold">{project.deadline}</p>
              </div>

              {/* Valor */}
              <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-slate-500 mb-2 text-xs">
                  <DollarSign className="w-4 h-4" /> Valor Acordado
                </div>
                <p className="text-[#d73cbe] font-bold text-lg">
                  {project.price}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Fechar Detalhes
          </button>
        </div>
      </div>
    </div>
  );
}
