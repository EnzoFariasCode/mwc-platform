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
  Plus,
} from "lucide-react";
import { useRef, useState, KeyboardEvent } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Estados do Formulário
  const [budgetType, setBudgetType] = useState<"fixed" | "hourly">("fixed");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");

  // Animação de Entrada/Saída
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

  // Lógica de Adicionar Tags
  const handleAddTag = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const tag = currentTag.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setCurrentTag("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Função para fechar (reseta estados se quiser)
  const handleClose = () => {
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
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 font-futura">
              Publicar Novo Projeto
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Preencha os dados para que os profissionais encontrem seu projeto.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
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

          {/* 2. Categoria e Tags (AGORA COM LÓGICA DE TAGS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Categoria Principal <span className="text-red-500">*</span>
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
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Habilidades Necessárias (Tags)
                <span className="text-xs font-normal text-slate-400 ml-2">
                  (Max 5)
                </span>
              </label>

              {/* Input de Tags */}
              <div className="w-full bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap gap-2 focus-within:border-[#d73cbe] focus-within:ring-1 focus-within:ring-[#d73cbe] transition-all shadow-sm min-h-[50px]">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    tags.length === 0
                      ? "Digite e aperte Enter (ex: React)..."
                      : ""
                  }
                  className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 min-w-[100px] p-1.5"
                  disabled={tags.length >= 5}
                />
                <button
                  onClick={handleAddTag}
                  disabled={!currentTag}
                  className="text-slate-400 hover:text-[#d73cbe]"
                >
                  <Plus className="w-5 h-5" />
                </button>
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
              placeholder="Explique o que você precisa, quais são os objetivos, se existe algum estilo preferido, etc."
              className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-800 placeholder:text-slate-400 focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe] outline-none transition-all shadow-sm resize-none"
            ></textarea>
            <p className="text-xs text-slate-500 mt-2 text-right">
              Mínimo de 50 caracteres
            </p>
          </div>

          {/* 4. Anexos */}
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

          <div className="h-px bg-slate-200 my-2" />

          {/* 5. Orçamento e Prazo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Orçamento */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">
                Qual seu orçamento?
              </label>

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
                <button
                  onClick={() => setBudgetType("hourly")}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                    budgetType === "hourly"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Por Hora
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
