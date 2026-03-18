/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import {
  X,
  DollarSign,
  Calendar,
  FileText,
  Loader2,
  Send,
  CheckCircle2,
  Edit2,
} from "lucide-react";
import { createProposal } from "@/modules/proposals/actions/create-proposal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SendProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  // NOVAS PROPS NECESSÁRIAS
  budgetType: string; // "fixed" ou "hourly"
  budgetValue: number; // O valor bruto (ex: 1500.00)
  budgetLabel: string; // O valor formatado (ex: "R$ 1.500,00")
}

export function SendProposalModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  budgetType,
  budgetValue,
  budgetLabel,
}: SendProposalModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Estados do formulário
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");
  const [coverLetter, setCoverLetter] = useState("");

  // Estado para controlar se aceita o valor do cliente ou personaliza
  // Se for Fixo e tiver valor, começa aceitando. Se for Hora, começa personalizado.
  const [pricingMode, setPricingMode] = useState<"match" | "custom">("custom");

  // Quando abrir o modal, reseta os estados
  useEffect(() => {
    if (isOpen) {
      if (budgetType === "fixed" && budgetValue > 0) {
        setPricingMode("match");
        setPrice(budgetValue.toString());
      } else {
        setPricingMode("custom");
        setPrice("");
      }
      setDays("");
      setCoverLetter("");
    }
  }, [isOpen, budgetType, budgetValue]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!price || !days || !coverLetter) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setIsLoading(true);

    const result = await createProposal({
      projectId,
      price: parseFloat(price),
      days: parseInt(days),
      coverLetter,
    });

    setIsLoading(false);

    if (result.success) {
      toast.success("Proposta enviada com sucesso!");
      onClose();
      router.refresh();
    } else {
      toast.error(result.error || "Erro ao enviar proposta.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0B1121] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
          <div>
            <h2 className="text-lg font-bold text-white font-futura">
              Enviar Proposta
            </h2>
            <p className="text-xs text-slate-400 truncate max-w-[300px]">
              {projectTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* SELEÇÃO DE MODO DE PREÇO (Apenas para Projetos Fixos com Valor Definido) */}
          {budgetType === "fixed" && budgetValue > 0 && (
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-900 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setPricingMode("match");
                  setPrice(budgetValue.toString());
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  pricingMode === "match"
                    ? "bg-[#d73cbe] text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aceitar ({budgetLabel})
              </button>

              <button
                type="button"
                onClick={() => {
                  setPricingMode("custom");
                  setPrice(""); // Limpa para ele digitar
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  pricingMode === "custom"
                    ? "bg-slate-700 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Outro Valor
              </button>
            </div>
          )}

          {/* CAMPOS DE VALOR E PRAZO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#d73cbe]" />
                {budgetType === "hourly"
                  ? "Valor por Hora (R$)"
                  : "Valor Total (R$)"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0,00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={pricingMode === "match"} // Bloqueia se estiver no modo "Aceitar"
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors placeholder:text-slate-600
                    ${
                      pricingMode === "match"
                        ? "border-green-500/30 text-green-400 opacity-80 cursor-not-allowed"
                        : "border-white/10 focus:border-[#d73cbe]"
                    }
                  `}
                  required
                />
                {pricingMode === "match" && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#d73cbe]" /> Prazo
                Estimado (Dias)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 7"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#d73cbe] transition-colors placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          {/* Carta de Apresentação */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#d73cbe]" /> Mensagem de
              Apresentação
            </label>
            <textarea
              rows={5}
              placeholder="Olá! Li o escopo do seu projeto e tenho experiência com..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#d73cbe] transition-colors placeholder:text-slate-600 resize-none"
              required
            />
          </div>

          {/* Botões */}
          <div className="pt-2 flex gap-3 border-t border-white/5 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-[2] py-3 bg-[#d73cbe] hover:bg-[#b0269a] text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Enviar Proposta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
