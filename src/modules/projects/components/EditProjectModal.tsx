/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { X, Save, Trash2, Lock } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any; // Recebe os dados do projeto clicado
}

export function EditProjectModal({
  isOpen,
  onClose,
  project,
}: EditProjectModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [price, setPrice] = useState("");

  // Atualiza o preço quando o projeto muda
  useEffect(() => {
    if (project) {
      // Remove R$ e formata simples para o input
      const cleanPrice = project.budget.replace(/[^0-9,]/g, "");
      setPrice(cleanPrice);
    }
  }, [project]);

  useGSAP(() => {
    if (isOpen) {
      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: 0.3,
        display: "flex",
      });
      gsap.fromTo(
        modalRef.current,
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.2)" }
      );
    } else {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        display: "none",
      });
    }
  }, [isOpen]);

  if (!project) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm hidden items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-futura">
              Detalhes do Anúncio
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie seu projeto em aberto.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto bg-slate-50/50">
          {/* Campos Bloqueados (Apenas Leitura) */}
          <div className="space-y-4 opacity-70">
            <div className="relative group">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Nome do Projeto
              </label>
              <input
                type="text"
                value={project.title}
                disabled
                className="w-full bg-slate-200 border border-slate-300 rounded-lg p-3 text-slate-600 cursor-not-allowed"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-9" />
            </div>

            <div className="relative group">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Descrição
              </label>
              <textarea
                rows={3}
                value="Descrição completa do projeto que não pode ser alterada para garantir a integridade das propostas já recebidas..."
                disabled
                className="w-full bg-slate-200 border border-slate-300 rounded-lg p-3 text-slate-600 cursor-not-allowed resize-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-9" />
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Campo Editável: Orçamento */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Ajustar Orçamento
              <span className="ml-2 text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                Editável
              </span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Você pode melhorar o valor para atrair mais profissionais.
            </p>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                R$
              </span>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3.5 pl-10 text-slate-900 font-bold focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe] outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-50 text-sm font-bold transition-colors">
            <Trash2 className="w-4 h-4" />
            Cancelar Projeto
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
            >
              Voltar
            </button>
            <button className="px-6 py-2.5 rounded-lg bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold shadow-lg shadow-purple-200 transition-all flex items-center gap-2">
              <Save className="w-4 h-4" />
              Salvar Novo Valor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
