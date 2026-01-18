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
  CheckCircle2,
} from "lucide-react";

interface MyProposalsViewProps {
  proposals: any[];
}

export default function MyProposalsView({ proposals }: MyProposalsViewProps) {
  return (
    <PageContainer>
      <div className="space-y-8">
        {/* --- Header --- */}
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
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#d73cbe]"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-slate-300 text-sm hover:text-white transition-colors cursor-pointer shrink-0">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- Grid de Cards --- */}
        {proposals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-white/10 transition-all group relative overflow-hidden min-h-[320px]"
              >
                {/* Efeito de Brilho no Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* --- Topo do Card --- */}
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <StatusBadge status={proposal.status} />
                    <button className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight min-h-[3rem]">
                      {proposal.project.title}
                    </h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1">
                      Para:{" "}
                      <span className="text-slate-300 font-medium truncate max-w-[150px]">
                        {proposal.project.owner.name}
                      </span>
                    </p>
                  </div>

                  {/* Carta de Apresentação (Resumo) */}
                  <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 mb-4">
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed h-[3.6em] italic">
                      "{proposal.coverLetter}"
                    </p>
                  </div>

                  {/* Dados Financeiros */}
                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 mb-6">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                        Valor Proposto
                      </p>
                      <p className="text-white font-bold">
                        {parseFloat(proposal.price).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                        Entrega
                      </p>
                      <p className="text-slate-300">
                        {proposal.estimatedDays} dias
                      </p>
                    </div>
                  </div>
                </div>

                {/* --- Rodapé de Ações --- */}
                <div className="mt-auto space-y-3">
                  {proposal.status === "REJECTED" ? (
                    <button className="w-full py-2.5 bg-slate-800 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed border border-white/5 opacity-70">
                      Proposta Recusada
                    </button>
                  ) : (
                    // GRID DE BOTÕES: Ver Projeto | Chat
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href={`/dashboard/encontrar-projetos/${proposal.project.id}`}
                        className="w-full"
                      >
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all border border-white/5 cursor-pointer">
                          <Eye className="w-4 h-4" />
                          Ver Projeto
                        </button>
                      </Link>

                      <Link
                        href={`/dashboard/chat?newChat=${proposal.project.owner.id}&projectId=${proposal.project.id}`}
                        className="w-full"
                      >
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#d73cbe]/10 hover:bg-[#d73cbe] text-[#d73cbe] hover:text-white text-xs font-bold rounded-lg transition-all border border-[#d73cbe]/20 hover:border-[#d73cbe] cursor-pointer shadow-lg shadow-purple-900/5">
                          <MessageSquare className="w-4 h-4" />
                          Chat
                        </button>
                      </Link>
                    </div>
                  )}

                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" /> Enviada em{" "}
                      {new Date(proposal.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Estado Vazio
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-white/5 border-dashed rounded-2xl text-center">
            <p className="text-slate-400">
              Você ainda não enviou nenhuma proposta.
            </p>
            <Link
              href="/dashboard/encontrar-projetos"
              className="text-[#d73cbe] font-bold text-sm mt-2 hover:underline"
            >
              Buscar Projetos
            </Link>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

// Badge de Status
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, any> = {
    PENDING: {
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/20",
      icon: Clock,
      label: "Aguardando",
    },
    ACCEPTED: {
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      icon: CheckCircle2,
      label: "Aceita",
    },
    REJECTED: {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      icon: XCircle,
      label: "Recusada",
    },
    WITHDRAWN: {
      color: "text-slate-500",
      bg: "bg-slate-800",
      border: "border-slate-700",
      icon: XCircle,
      label: "Cancelada",
    },
  };

  const currentStyle = styles[status] || styles.PENDING;
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
