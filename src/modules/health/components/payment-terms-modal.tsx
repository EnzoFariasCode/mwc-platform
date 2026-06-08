"use client";

import { useState } from "react";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";

interface PaymentTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  isLoading?: boolean;
}

const paymentTerms = [
  {
    title: "Retencao do Valor (Escrow)",
    content:
      "O valor pago ficara retido com seguranca pela plataforma apos a aprovacao do pagamento. Ele nao sera transferido ao profissional ate que a consulta seja concluida, garantindo protecao para ambas as partes.",
  },
  {
    title: "Liberacao do Valor",
    content:
      "O valor sera liberado ao profissional somente apos a confirmacao de conclusao da consulta, seja pelo profissional ou automaticamente pelo sistema apos 24 horas do horario agendado.",
  },
  {
    title: "Seguranca de Pagamento",
    content:
      "Seu pagamento e processado pelo Stripe com criptografia PCI-DSS nivel 1. Seus dados de cartao nao sao armazenados em nossos servidores.",
  },
  {
    title: "Cancelamento e Reembolso pelo Paciente",
    content:
      "Cancelamento com mais de 24h de antecedencia: reembolso integral processado em ate 5 a 10 dias uteis no metodo de pagamento original. Cancelamento com menos de 24h de antecedencia: sem direito a reembolso. O valor sera repassado ao profissional como compensacao pela reserva do horario.",
  },
  {
    title: "Nao Comparecimento do Paciente",
    content:
      "Caso voce nao compareca a consulta sem cancelamento previo, o valor sera integralmente repassado ao profissional. Nao ha reembolso nessa situacao.",
  },
  {
    title: "Cancelamento ou Nao Comparecimento do Profissional",
    content:
      "Caso o profissional cancele ou nao compareca, voce tera direito a reembolso integral, independentemente do prazo. O reembolso sera processado em ate 5 a 10 dias uteis.",
  },
  {
    title: "Disputas e Protecao Legal",
    content:
      "Este aceite, junto com o registro de data, hora e IP, serve como comprovante legal de concordancia com estes termos. Ambas as partes estao protegidas pelas politicas da plataforma.",
  },
];

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
        <div className="sticky top-0 bg-[#0f172a] border-b border-white/10 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-[#d73cbe]" />
            <h2 className="text-xl font-bold text-white">
              Termos de Pagamento
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white cursor-pointer"
            aria-label="Fechar termos de pagamento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="bg-[#d73cbe]/5 border border-[#d73cbe]/20 rounded-lg p-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              Leia atentamente antes de confirmar. Ao aceitar, voce concorda
              com todas as condicoes abaixo.
            </p>
          </div>

          {paymentTerms.map((term, index) => (
            <div className="space-y-3" key={term.title}>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#d73cbe]/20 text-[#d73cbe] flex items-center justify-center text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                {term.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed ml-8">
                {term.content}
              </p>
            </div>
          ))}

          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="w-5 h-5 mt-0.5 accent-[#d73cbe] cursor-pointer"
              />
              <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">
                Confirmo que li, entendi e{" "}
                <strong>aceito todos os termos de pagamento</strong> acima
                descritos. Tambem confirmo que autorizo o processamento seguro
                do meu pagamento.
              </span>
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#0f172a] border-t border-white/10 px-8 py-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            Nao Aceito
          </button>
          <button
            type="button"
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
