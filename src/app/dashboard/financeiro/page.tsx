"use client";

import { PageContainer } from "@/components/dashboard/PageContainer";
import { useState } from "react";
import Link from "next/link"; // <--- IMPORT CORRETO AQUI NO TOPO
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  History,
  Landmark,
  AlertCircle,
  ChevronRight,
  DollarSign,
  X,
} from "lucide-react";

// --- DADOS MOCKADOS (Troque para [] para testar o estado vazio) ---
const TRANSACTIONS = [
  {
    id: 1,
    type: "credit", // credit = recebeu, debit = sacou
    label: "Pagamento: Landing Page Advogados",
    date: "12/01/2026",
    amount: "R$ 1.500,00",
    status: "completed", // completed, processing, failed
  },
  {
    id: 2,
    type: "debit",
    label: "Saque via PIX",
    date: "10/01/2026",
    amount: "R$ 800,00",
    status: "completed",
  },
  {
    id: 3,
    type: "credit",
    label: "Pagamento: Script Python",
    date: "05/01/2026",
    amount: "R$ 800,00",
    status: "completed",
  },
  {
    id: 4,
    type: "credit",
    label: "Pagamento: Edição Vídeo",
    date: "02/01/2026",
    amount: "R$ 200,00",
    status: "processing", // Dinheiro entrando mas ainda não liberado
  },
];

// Mude para true para ver a tela de "Sem Movimentações"
const IS_EMPTY_STATE = false;

export default function FinanceiroPage() {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Totais calculados (Mock)
  const totalAvailable = "R$ 1.700,00";
  const totalPending = "R$ 200,00"; // Dinheiro "A liberar"
  const totalLifeTime = "R$ 3.300,00"; // Tudo que já ganhou na vida

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-futura">
              Financeiro
            </h1>
            <p className="text-muted-foreground text-sm">
              Gerencie seus ganhos, saques e histórico de transações.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-muted-foreground text-sm hover:text-foreground transition-colors cursor-pointer">
            <Download className="w-4 h-4" /> Exportar Relatório
          </button>
        </div>

        {/* --- CARDS PRINCIPAIS (Wallet) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Saldo Principal (Destaque) */}
          <div className="lg:col-span-2 bg-gradient-to-br from-primary/20 to-purple-900/20 border border-primary/20 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
            {/* Background Decorativo */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-32 h-32 text-primary" />
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Saldo Disponível
              </p>
              <h2 className="text-4xl font-bold text-foreground font-futura mt-2">
                {IS_EMPTY_STATE ? "R$ 0,00" : totalAvailable}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                + {IS_EMPTY_STATE ? "R$ 0,00" : totalPending} a liberar em breve
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={IS_EMPTY_STATE}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpRight className="w-4 h-4" /> Sacar Valor
              </button>
              <button className="bg-card hover:bg-white/5 text-foreground border border-white/10 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer">
                Cadastrar Chave Pix
              </button>
            </div>
          </div>

          {/* Card 2: Resumo e Dados Bancários */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-6">
            {/* Total Ganho */}
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                Total Ganho (Vitalício)
              </p>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {IS_EMPTY_STATE ? "R$ 0,00" : totalLifeTime}
                </span>
              </div>
            </div>

            <div className="h-px bg-border w-full" />

            {/* Conta Vinculada */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Conta de Recebimento
                </p>
                <button className="text-[10px] text-primary hover:underline cursor-pointer">
                  Alterar
                </button>
              </div>
              <div className="flex items-center gap-3 bg-background/50 p-3 rounded-xl border border-border">
                <div className="p-2 bg-slate-800 rounded-lg text-white">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Nu Pagamentos S.A.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pix: ***.123.456-**
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- EXTRATO / HISTÓRICO --- */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground font-futura flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Histórico de Movimentações
          </h3>

          {/* LISTA DE TRANSAÇÕES */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {IS_EMPTY_STATE || TRANSACTIONS.length === 0 ? (
              // --- EMPTY STATE (SEM DADOS) ---
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-bold text-foreground">
                  Nenhuma movimentação ainda
                </h4>
                <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                  Assim que você concluir seu primeiro projeto e o cliente
                  liberar o pagamento, o valor aparecerá aqui.
                </p>
                <Link href="/dashboard/encontrar-projetos">
                  <button className="text-primary font-bold text-sm hover:underline cursor-pointer">
                    Buscar projetos agora
                  </button>
                </Link>
              </div>
            ) : (
              // --- LISTA COM DADOS ---
              <div className="divide-y divide-border">
                {TRANSACTIONS.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icone Baseado no Tipo */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          item.type === "credit"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {item.type === "credit" ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <p className="font-bold text-foreground text-sm">
                          {item.label}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{item.date}</span>
                          <span>•</span>
                          <StatusText status={item.status} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 pl-14 md:pl-0">
                      <span
                        className={`font-bold font-futura ${
                          item.type === "credit"
                            ? "text-green-400"
                            : "text-foreground"
                        }`}
                      >
                        {item.type === "credit" ? "+" : "-"} {item.amount}
                      </span>
                      <button className="text-muted-foreground hover:text-foreground">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MODAL DE SAQUE (Visual) */}
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="font-bold text-lg text-foreground">
                  Solicitar Saque
                </h3>
                <button
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-primary/80 uppercase font-bold">
                    Disponível para saque
                  </p>
                  <p className="text-2xl font-bold text-primary font-futura mt-1">
                    {totalAvailable}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Valor do saque
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                      R$
                    </span>
                    <input
                      type="number"
                      placeholder="0,00"
                      className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-foreground focus:border-primary focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-background p-3 rounded-lg border border-border">
                  <p className="mb-1">
                    <strong>Destino:</strong> Nu Pagamentos S.A. (Pix ***.123)
                  </p>
                  <p>O valor cairá na sua conta em até 1 dia útil.</p>
                </div>
              </div>

              <div className="p-4 border-t border-border bg-background/50 flex justify-end gap-3">
                <button
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancelar
                </button>
                <button className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl cursor-pointer shadow-lg shadow-primary/20">
                  Confirmar Saque
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

// Componente de Texto de Status
function StatusText({ status }: { status: string }) {
  if (status === "completed")
    return <span className="text-green-500">Concluído</span>;
  if (status === "processing")
    return <span className="text-yellow-500">Em processamento</span>;
  if (status === "failed") return <span className="text-red-500">Falhou</span>;
  return null;
}
