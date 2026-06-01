"use client";

import { useState } from "react";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";

interface PaymentTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  isLoading?: boolean;
}

export function PaymentTermsModal({
  isOpen,
  onClose,
  onAccept,
  isLoading = false,
}: PaymentTermsModalProps) {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0f172a] border-b border-white/10 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-[#d73cbe]" />
            <h2 className="text-xl font-bold text-white">Termos de Pagamento</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* Intro */}
          <div className="bg-[#d73cbe]/5 border border-[#d73cbe]/20 rounded-lg p-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              Leia atentamente os termos abaixo antes de confirmar seu pagamento. Ao aceitar, você concorda com as condições de retenção e reembolso.
            </p>
          </div>

          {/* Termo 1: Retenção de Valor */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#d73cbe]/20 text-[#d73cbe] flex items-center justify-center text-xs font-bold">
                1
              </span>
              Retenção do Valor
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed ml-8">
              O valor da sua consulta será <strong>retido</strong> de forma segura pela plataforma Stripe após o pagamento ser aprovado. Este valor não será transferido imediatamente para o profissional, garantindo segurança para ambas as partes.
            </p>
          </div>

          {/* Termo 2: Liberação após conclusão */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#d73cbe]/20 text-[#d73cbe] flex items-center justify-center text-xs font-bold">
                2
              </span>
              Liberação do Valor
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed ml-8">
              Somente <strong>após a confirmação da conclusão da consulta</strong> pelo profissional, o valor será transferido para a carteira do profissional (financeiro). Isso garante que o serviço foi realmente prestado.
            </p>
          </div>

          {/* Termo 3: Segurança de Pagamento */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#d73cbe]/20 text-[#d73cbe] flex items-center justify-center text-xs font-bold">
                3
              </span>
              Segurança de Pagamento
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed ml-8">
              Seu pagamento é 100% seguro e processado através da plataforma Stripe, que utiliza criptografia de ponta a ponta (PCI-DSS Level 1). Seus dados de cartão não são armazenados em nossos servidores.
            </p>
          </div>

          {/* Termo 4: Política de Reembolso */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#d73cbe]/20 text-[#d73cbe] flex items-center justify-center text-xs font-bold">
                4
              </span>
              Política de Reembolso
            </h3>
            <div className="text-sm text-slate-400 leading-relaxed ml-8 space-y-2">
              <p>
                <strong className="text-white">✓ Reembolso permitido:</strong> Você pode cancelar e solicitar reembolso <strong>até 24 horas antes</strong> da data e hora marcada para a consulta.
              </p>
              <p>
                <strong className="text-[#d73cbe]">✗ Reembolso não permitido:</strong> Cancelamentos realizados <strong>menos de 24 horas antes</strong> da consulta não terão direito a reembolso. O valor será retido na plataforma.
              </p>
              <p>
                O reembolso, quando permitido, será processado em até 3-5 dias úteis de volta ao seu método de pagamento original.
              </p>
            </div>
          </div>

          {/* Termo 5: Ausência e Não Comparecimento */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#d73cbe]/20 text-[#d73cbe] flex items-center justify-center text-xs font-bold">
                5
              </span>
              Não Comparecimento
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed ml-8">
              Caso você não compareça na consulta agendada (sem cancelamento prévio), o valor será considerado como forfeit e não terá direito a reembolso. O profissional poderá solicitar compensação.
            </p>
          </div>

          {/* Termo 6: Responsabilidade */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#d73cbe]/20 text-[#d73cbe] flex items-center justify-center text-xs font-bold">
                6
              </span>
              Proteção Legal
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed ml-8">
              Esta confirmação serve como comprovante de que você aceita os termos de pagamento. Registramos sua data, hora e IP para fins de compliance e proteção em caso de disputas. Ambas as partes estão protegidas sob os termos de serviço da plataforma.
            </p>
          </div>

          {/* Checkbox */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-[#d73cbe] cursor-pointer"
              />
              <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">
                Confirmo que li, entendi e <strong>aceito todos os termos de pagamento</strong> acima descritos. Também confirmo que autorizo o processamento seguro do meu pagamento.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0f172a] border-t border-white/10 px-8 py-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            Não Aceito
          </button>
          <button
            onClick={handleAccept}
            disabled={!accepted || isLoading}
            className={`px-6 py-3 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${
              accepted && !isLoading
                ? "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer shadow-lg shadow-emerald-900/20 active:scale-95"
                : "bg-slate-600 text-slate-300 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Pagar e Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
