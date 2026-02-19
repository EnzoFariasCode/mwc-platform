"use client";

import { PageContainer } from "@/components/dashboard/PageContainer";
import {
  ArrowLeft,
  Lock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  User,
  AlertTriangle,
  CreditCard,
  QrCode,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { createProjectCheckout } from "@/actions/stripe/create-project-checkout";

interface CheckoutViewProps {
  proposalId: string;
  projectTitle: string;
  professionalName: string;
  price: number;
  deadline: number;
}

export default function CheckoutView({
  proposalId,
  projectTitle,
  professionalName,
  price,
  deadline,
}: CheckoutViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const SCOPE_ITEMS = [
    "Entrega de projeto completo",
    "Suporte/dúvidas com o profissional (Chat)",
    "Garantia de Entrega MWC",
  ];

  const handlePayment = async () => {
    setIsLoading(true);
    setIsRedirecting(true);

    // 1. Inicia a contagem regressiva de 5 segundos visualmente
    for (let i = 5; i > 0; i--) {
      setCountdown(i);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // 2. Após os 5 segundos, gera o link e redireciona
    try {
      const result = await createProjectCheckout(proposalId);

      if (result.error) {
        toast.error(result.error);
        setIsRedirecting(false);
        setIsLoading(false);
      } else if (result.url) {
        window.location.href = result.url; // Vai para a Stripe
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao preparar o ambiente seguro.");
      setIsRedirecting(false);
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Topo de Navegação */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/meus-projetos"
            className="flex items-center gap-2 text-white hover:text-slate-300 transition-colors group font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para Proposta
          </Link>
          <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold tracking-widest">
            <Lock className="w-3 h-3" /> Ambiente Seguro
          </div>
        </div>

        {/* Título Principal */}
        <div>
          <h1 className="text-2xl font-bold text-white font-futura mb-1">
            Finalizar Contratação
          </h1>
          <p className="text-slate-400 text-sm">
            Revise os dados e vá para o ambiente seguro para efetuar o
            pagamento.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* === COLUNA ESQUERDA (2/3): INFORMAÇÕES === */}
          <div className="lg:col-span-2 space-y-6">
            {/* Aviso de Retenção (Escrow) */}
            <div className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 flex gap-4 items-start animate-in fade-in slide-in-from-top-2">
              <div className="p-3 bg-yellow-500/20 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h4 className="text-yellow-500 font-bold text-lg mb-1">
                  Pagamento Seguro (Escrow)
                </h4>
                <p className="text-sm text-yellow-200/80 leading-relaxed">
                  O valor{" "}
                  <strong>não vai direto para o profissional agora</strong>. Ele
                  fica retido na conta cofre da MWC e só é liberado para o
                  profissional após você confirmar que recebeu os arquivos
                  finais conforme o combinado. Se houver problemas, seu dinheiro
                  está protegido.
                </p>
              </div>
            </div>

            {/* Informações sobre a Stripe */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
              <div className="flex gap-4 justify-center mb-6">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/5 shadow-lg">
                  <CreditCard className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/5 shadow-lg">
                  <QrCode className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Pagamento processado pela Stripe
              </h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                Para sua total segurança, você não precisa inserir os dados do
                seu cartão no nosso site. Você será redirecionado para a página
                oficial da Stripe, o maior e mais seguro processador de
                pagamentos do mundo.
              </p>
              <div className="flex items-center gap-6 text-sm font-bold text-slate-500">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cartão
                  em até 12x
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Pix
                  Instantâneo
                </span>
              </div>
            </div>
          </div>

          {/* === COLUNA DIREITA (1/3): RESUMO === */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 sticky top-24 shadow-xl shadow-black/20">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-[#d73cbe]" /> Resumo do Pedido
              </h3>

              <div className="mb-6 pb-6 border-b border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                  Projeto
                </p>
                <p className="text-white font-medium leading-snug text-sm line-clamp-2">
                  {projectTitle}
                </p>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Profissional:{" "}
                  <span className="text-white font-bold">
                    {professionalName}
                  </span>
                </p>
              </div>

              <div className="mb-6 pb-6 border-b border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-3">
                  O que está incluso
                </p>
                <ul className="space-y-2">
                  {SCOPE_ITEMS.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-xs text-slate-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Valor do Serviço</span>
                  <span className="text-white">
                    {price.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Taxa MWC (0%)</span>
                  <span className="text-green-400">Grátis (Beta)</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-white/5">
                  <span className="text-white font-bold text-sm">
                    Total a Pagar
                  </span>
                  <div className="text-right">
                    <span className="block text-2xl font-mono font-bold text-[#d73cbe]">
                      {price.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de Pagar e Overlay de Redirecionamento */}
              {isRedirecting ? (
                <div className="w-full py-4 bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 text-white animate-in zoom-in-95">
                  <Loader2 className="w-6 h-6 animate-spin text-[#d73cbe]" />
                  <span className="text-sm font-bold">
                    Redirecionando em {countdown}...
                  </span>
                  <span className="text-xs text-slate-400">
                    Aguarde, não feche a página.
                  </span>
                </div>
              ) : (
                <button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Ir para Pagamento Seguro{" "}
                  <ExternalLink className="w-4 h-4 ml-1 opacity-50" />
                </button>
              )}

              <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-500">
                  Ao confirmar, você concorda com os{" "}
                  <span className="text-slate-300 underline cursor-pointer">
                    Termos de Serviço
                  </span>
                  .
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3" /> Compra 100% Protegida
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
