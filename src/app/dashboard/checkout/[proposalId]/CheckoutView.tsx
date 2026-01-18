"use client";

import { PageContainer } from "@/components/dashboard/PageContainer";
import {
  ArrowLeft,
  CreditCard,
  Lock,
  ShieldCheck,
  Wallet,
  CheckCircle2,
  FileText,
  User,
  QrCode,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { acceptProposalAndStartProject } from "@/actions/proposals/accept-proposal";

interface CheckoutViewProps {
  proposalId: string;
  projectTitle: string;
  professionalName: string;
  price: number; // Valor real do banco
  deadline: number; // Dias estimados
}

export default function CheckoutView({
  proposalId,
  projectTitle,
  professionalName,
  price,
  deadline,
}: CheckoutViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("card");
  const [installments, setInstallments] = useState(1);
  const router = useRouter();

  // Itens fixos conforme solicitado
  const SCOPE_ITEMS = [
    "Entrega de projeto completo",
    "Suporte/dúvidas com o profissional (Chat)",
    "Garantia de Entrega MWC",
  ];

  const handlePayment = async () => {
    setIsLoading(true);
    // Simula processamento
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await acceptProposalAndStartProject(proposalId);

    if (result.success) {
      toast.success("Pagamento confirmado! Projeto iniciado.");
      router.push("/dashboard/meus-projetos");
    } else {
      toast.error(result.error || "Erro ao processar pagamento.");
    }
    setIsLoading(false);
  };

  const installmentValue = price / installments;

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
            Revise os dados e efetue o pagamento para iniciar o projeto.
          </p>
        </div>

        {/* Aviso de Retenção (Escrow) */}
        <div className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-4 items-center animate-in fade-in slide-in-from-top-2">
          <div className="p-2 bg-yellow-500/20 rounded-full shrink-0">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h4 className="text-yellow-500 font-bold text-sm mb-0.5">
              Pagamento Seguro (Escrow)
            </h4>
            <p className="text-sm text-yellow-200/80 leading-relaxed">
              O valor <strong>não vai direto para o profissional</strong>. Ele
              fica retido na MWC e só é liberado após você confirmar que recebeu
              os arquivos finais conforme combinado.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* === COLUNA ESQUERDA (2/3): DADOS E PAGAMENTO === */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Dados do Pagador */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-base">
                <User className="w-5 h-5 text-[#d73cbe]" />
                Dados do Titular
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Como no cartão"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d73cbe] transition-colors text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    CPF / CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d73cbe] transition-colors text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 2. Método de Pagamento */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-base">
                <Wallet className="w-5 h-5 text-[#d73cbe]" />
                Pagamento
              </h3>

              {/* Tabs de Seleção */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden group ${
                    paymentMethod === "card"
                      ? "bg-[#d73cbe]/10 border-[#d73cbe] text-white"
                      : "bg-slate-950 border-white/10 text-slate-400 hover:border-white/30"
                  }`}
                >
                  <CreditCard
                    className={`w-6 h-6 ${
                      paymentMethod === "card"
                        ? "text-[#d73cbe]"
                        : "text-slate-500"
                    }`}
                  />
                  <span className="text-sm font-bold">Cartão de Crédito</span>
                  {paymentMethod === "card" && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-[#d73cbe] rounded-full animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setPaymentMethod("pix")}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden group ${
                    paymentMethod === "pix"
                      ? "bg-[#d73cbe]/10 border-[#d73cbe] text-white"
                      : "bg-slate-950 border-white/10 text-slate-400 hover:border-white/30"
                  }`}
                >
                  <QrCode
                    className={`w-6 h-6 ${
                      paymentMethod === "pix"
                        ? "text-[#d73cbe]"
                        : "text-slate-500"
                    }`}
                  />
                  <span className="text-sm font-bold">Pix Instantâneo</span>
                  {paymentMethod === "pix" && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-[#d73cbe] rounded-full animate-pulse" />
                  )}
                </button>
              </div>

              {/* Formulário Cartão */}
              {paymentMethod === "card" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Número do Cartão
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d73cbe] pl-12 text-sm"
                      />
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Validade
                      </label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d73cbe] text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d73cbe] text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Parcelamento
                    </label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d73cbe] appearance-none cursor-pointer text-sm"
                    >
                      {[1, 2, 3, 4, 5].map((i) => (
                        <option key={i} value={i}>
                          {i}x de{" "}
                          {(price / i).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                          {i === 1 ? " (Sem juros)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Área Pix */}
              {paymentMethod === "pix" && (
                <div className="bg-slate-950 rounded-xl p-8 text-center border border-dashed border-slate-700 animate-in fade-in slide-in-from-top-2">
                  <div className="w-40 h-40 bg-white mx-auto rounded-lg mb-4 flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-slate-900" />
                  </div>
                  <p className="text-white font-bold text-lg mb-1">
                    Pagamento via Pix
                  </p>
                  <p className="text-slate-400 text-sm">
                    O QR Code para pagamento será gerado na próxima etapa.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* === COLUNA DIREITA (1/3): RESUMO === */}
          <div className="space-y-6">
            {/* CARD RESUMO DO PEDIDO */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 sticky top-24 shadow-xl shadow-black/20">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-[#d73cbe]" /> Resumo do Pedido
              </h3>

              {/* Título do Projeto (DADOS REAIS) */}
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

              {/* Checklist do Escopo (FIXO/ PADRÃO) */}
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

              {/* Valores (DADOS REAIS) */}
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
                    {installments > 1 && (
                      <span className="text-xs text-slate-400">
                        em {installments}x de{" "}
                        {installmentValue.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botão de Pagar */}
              <button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <>Processando...</>
                ) : (
                  <>
                    <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Pagar e Iniciar Projeto
                  </>
                )}
              </button>

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