"use client";

import { PageContainer } from "@/components/dashboard/PageContainer";
import Link from "next/link";
import {
  Search,
  MessageSquare,
  Clock,
  Eye,
  MoreVertical,
  XCircle,
  Filter,
} from "lucide-react";

// --- DADOS MOCKADOS (Apenas propostas EM ABERTO ou RECUSADAS) ---
const MY_PROPOSALS = [
  {
    id: 1,
    projectTitle: "Landing Page para Advogados",
    clientName: "Dr. Roberto Campos",
    status: "viewed", // O cliente viu, mas não respondeu ainda
    sentAt: "Há 2 horas",
    value: "R$ 1.500,00",
    deliveryTime: "7 dias",
    description:
      "Proposta inclui design no Figma, desenvolvimento em Next.js e hospedagem na Vercel.",
  },
  {
    id: 2,
    projectTitle: "Automação de Planilhas Excel",
    clientName: "Construtora Silva",
    status: "negotiation", // Vocês estão trocando ideia no chat
    sentAt: "Ontem",
    value: "R$ 800,00",
    deliveryTime: "3 dias",
    description:
      "Script em Python para ler XMLs e gerar relatórios automáticos.",
  },
  {
    id: 3,
    projectTitle: "Edição de Vídeo p/ YouTube",
    clientName: "Canal TechDaily",
    status: "rejected", // O cliente fechou com outro
    sentAt: "10/01/2026",
    value: "R$ 200,00",
    deliveryTime: "1 dia",
    description: "Edição dinâmica estilo Cortes do Casimiro.",
  },
  {
    id: 4,
    projectTitle: "App de Delivery (Clone iFood)",
    clientName: "Hamburgueria Top",
    status: "accepted", // Apenas para exemplo visual
    sentAt: "05/01/2026",
    value: "R$ 12.000,00",
    deliveryTime: "45 dias",
    description: "Desenvolvimento completo Mobile (Flutter) + Backend.",
  },
];

export default function MinhasPropostasPage() {
  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-futura">
              Minhas Propostas
            </h1>
            <p className="text-slate-400 text-sm">
              Acompanhe o status das suas negociações.
            </p>
          </div>

          {/* Botão de Filtro Visual e Busca */}
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-slate-300 text-sm hover:text-white transition-colors cursor-pointer shrink-0">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grid de Cards (Padrão Visual Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MY_PROPOSALS.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-white/10 transition-all group relative overflow-hidden min-h-[320px]"
            >
              {/* Efeito Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {/* Topo do Card */}
              <div>
                {/* Header do Card */}
                <div className="flex justify-between items-start mb-4">
                  <StatusBadge status={proposal.status} />
                  <button className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Título e Cliente */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight min-h-[3rem]">
                    {proposal.projectTitle}
                  </h3>
                  <p className="text-sm text-slate-400 flex items-center gap-1">
                    Para:{" "}
                    <span className="text-slate-300 font-medium truncate max-w-[150px]">
                      {proposal.clientName}
                    </span>
                  </p>
                </div>

                {/* Resumo */}
                <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 mb-4">
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed h-[3.6em]">
                    {proposal.description}
                  </p>
                </div>

                {/* Valores */}
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 mb-6">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                      Valor
                    </p>
                    <p className="text-white font-bold">{proposal.value}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                      Entrega
                    </p>
                    <p className="text-slate-300">{proposal.deliveryTime}</p>
                  </div>
                </div>
              </div>

              {/* Rodapé de Ações */}
              <div className="mt-auto">
                {/* Se estiver rejeitado, mostra botão desabilitado */}
                {proposal.status === "rejected" ? (
                  <button className="w-full py-2.5 bg-slate-800 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed border border-white/5 opacity-70">
                    Proposta Recusada
                  </button>
                ) : (
                  <Link href="/dashboard/chat" className="block w-full">
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold rounded-lg transition-all border border-primary/20 hover:border-primary cursor-pointer shadow-lg shadow-primary/5">
                      <MessageSquare className="w-4 h-4" />
                      Negociar no Chat
                    </button>
                  </Link>
                )}
                <div className="text-center mt-3">
                  <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" /> Enviada {proposal.sentAt}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}

// Badge de Status
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, any> = {
    sent: {
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/20",
      icon: Clock,
      label: "Enviada",
    },
    viewed: {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      icon: Eye,
      label: "Visto",
    },
    negotiation: {
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
      icon: MessageSquare,
      label: "Negociando",
    },
    accepted: {
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      icon: null, // CheckCircle2 importado se necessário
      label: "Aceita",
    },
    rejected: {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      icon: XCircle,
      label: "Recusada",
    },
  };

  const currentStyle = styles[status] || styles.sent;
  const Icon = currentStyle.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${currentStyle.bg} border ${currentStyle.border} text-[10px] font-bold ${currentStyle.color} uppercase tracking-wide`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {currentStyle.label}
    </span>
  );
}
