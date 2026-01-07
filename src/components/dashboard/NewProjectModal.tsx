"use client";

import {
  X,
  Upload,
  DollarSign,
  Calendar,
  Tag,
  Paperclip,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Estado para tipo de orçamento
  const [budgetType, setBudgetType] = useState<"fixed" | "hourly">("fixed");

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

  // Função para fechar clicando fora ou no X
  const handleClose = () => {
    // Animação de saída manual antes de fechar o estado (opcional, aqui simplificado)
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm hidden items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()} // Impede fechar ao clicar dentro
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header Branco */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 font-futura">
              Publicar Novo Projeto
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Descreva sua necessidade para encontrar o profissional ideal.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body (Scrollável) */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto bg-slate-50/50">
          {/* 1. Nome do Projeto */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Nome do Projeto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Criação de Identidade Visual para Café Gourmet"
              className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-slate-800 placeholder:text-slate-400 focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe] focus:outline-none transition-all shadow-sm"
            />
          </div>

          {/* 2. Categoria e Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Categoria Principal
              </label>
              <div className="relative">
                <select className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-slate-700 focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe] outline-none appearance-none cursor-pointer shadow-sm">
                  <option value="" disabled selected>
                    Selecione uma categoria
                  </option>
                  <option>Design e Multimedia</option>
                  <option>TI e Programação</option>
                  <option>Marketing e Vendas</option>
                  <option>Tradução e Conteúdo</option>
                  <option>Jurídico</option>
                  <option>Engenharia</option>
                </select>
                {/* Seta customizada via CSS ou ícone absoluto seria ideal aqui */}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Habilidades Desejadas
                <span className="text-xs font-normal text-slate-400 ml-2">
                  (Opcional)
                </span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ex: Logo, Photoshop, Figma..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-800 placeholder:text-slate-400 focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe] outline-none transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* 3. Descrição */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Descrição Detalhada <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Explique o que você precisa, quais são os objetivos, se existe algum estilo preferido, etc. Quanto mais detalhes, melhores as propostas."
              className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-800 placeholder:text-slate-400 focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe] outline-none transition-all shadow-sm resize-none"
            ></textarea>
            <p className="text-xs text-slate-500 mt-2 text-right">
              Mínimo de 50 caracteres
            </p>
          </div>

          {/* 4. Anexos (Novo!) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Anexos de Referência
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="p-3 bg-slate-100 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Paperclip className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-600 font-medium">
                Clique para fazer upload ou arraste arquivos
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PDF, JPG, PNG até 10MB
              </p>
            </div>
          </div>

          {/* Divisor */}
          <div className="h-px bg-slate-200 my-2" />

          {/* 5. Orçamento e Prazo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Orçamento */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">
                Qual seu orçamento?
              </label>

              {/* Switch Tipo de Orçamento */}
              <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setBudgetType("fixed")}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                    budgetType === "fixed"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Preço Fixo
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                  R$
                </span>
                <input
                  type="number"
                  placeholder={
                    budgetType === "fixed" ? "Ex: 1500,00" : "Ex: 50,00"
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-800 placeholder:text-slate-400 focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe] outline-none transition-all shadow-sm font-medium"
                />
              </div>
            </div>

            {/* Prazo */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Para quando você precisa?
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select className="w-full bg-white border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-700 focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe] outline-none appearance-none cursor-pointer shadow-sm">
                  <option>Urgente (em até 24h)</option>
                  <option>Para essa semana</option>
                  <option>Para este mês</option>
                  <option>Posso esperar (sem pressa)</option>
                </select>
              </div>
              <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Projetos urgentes costumam custar 20% a mais.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-400 hidden md:inline-block">
            * Campos obrigatórios
          </span>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={handleClose}
              className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer font-bold"
            >
              Cancelar
            </button>
            <button className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold shadow-lg shadow-purple-200 transition-all cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5">
              <Upload className="w-4 h-4" />
              Publicar Projeto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
