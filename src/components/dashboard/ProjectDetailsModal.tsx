"use client";

import {
  X,
  Calendar,
  DollarSign,
  Briefcase,
  Send,
  Users,
  ChevronDown,
  CheckCircle2,
  MessageSquare,
  Star,
  Loader2,
  Clock,
  Quote,
} from "lucide-react";
import { useState, useEffect } from "react";
import { SendProposalModal } from "./SendProposalModal";
import { getProjectProposals } from "@/actions/proposals/get-project-proposals";
import { toast } from "sonner";
import Link from "next/link";

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  allowProposal?: boolean;
  isOwner?: boolean;
}

export function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
  allowProposal = false,
  isOwner = false,
}: ProjectDetailsModalProps) {
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  // Estados para Propostas
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [showProposals, setShowProposals] = useState(false);

  useEffect(() => {
    if (isOpen && isOwner && project?.id) {
      const fetchProposals = async () => {
        setIsLoadingProposals(true);
        const res = await getProjectProposals(project.id);
        if (res.success) {
          setProposals(res.data || []);
          if (res.data && res.data.length > 0) setShowProposals(true);
        } else {
          toast.error("Erro ao carregar propostas.");
        }
        setIsLoadingProposals(false);
      };
      fetchProposals();
    }
  }, [isOpen, isOwner, project]);

  if (!isOpen || !project) return null;

  const budgetLabel = project.budgetLabel || "A combinar";
  const deadline = project.deadline || "Não informado";
  const category = project.category || "Geral";
  const tags = project.tags || [];

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-[#0B1121] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          {/* --- HEADER --- */}
          <div className="p-6 border-b border-white/5 bg-[#0B1121]">
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded bg-slate-800 text-[10px] font-bold text-slate-400">
                  #{project.id.slice(0, 4).toUpperCase()}
                </span>
                <StatusBadge status={project.status} />
                <span className="px-2 py-1 rounded-full bg-slate-800 border border-white/5 text-[10px] font-bold text-slate-300 uppercase">
                  {category}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>
            <h2 className="text-2xl font-bold text-white font-futura leading-tight">
              {project.title}
            </h2>
          </div>

          {/* --- BODY --- */}
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
            {/* === ÁREA VIP: PROPOSTAS (Só aparece para o dono) === */}
            {isOwner && (
              <div className="relative">
                {/* Botão Principal / Toggle */}
                <button
                  onClick={() => setShowProposals(!showProposals)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all group relative overflow-hidden ${
                    showProposals
                      ? "bg-slate-900 border-[#d73cbe]/30"
                      : "bg-slate-900/50 border-white/10 hover:border-[#d73cbe]/30"
                  }`}
                >
                  {/* Background Gradient Sutil */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-[#d73cbe]/10 to-transparent transition-opacity ${
                      showProposals
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-50"
                    }`}
                  />

                  <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-[#d73cbe] flex items-center justify-center text-white shadow-lg shadow-[#d73cbe]/20">
                        <Users size={20} className="fill-current" />
                      </div>
                      {proposals.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#d73cbe] text-xs font-bold rounded-full flex items-center justify-center border-2 border-[#0B1121]">
                          {proposals.length}
                        </span>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white text-lg leading-none mb-1">
                        Propostas Recebidas
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        {isLoadingProposals
                          ? "Atualizando lista..."
                          : proposals.length === 0
                          ? "Nenhum profissional interessado ainda."
                          : "Analise e escolha o melhor profissional."}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 relative z-10 ${
                      showProposals ? "rotate-180 text-[#d73cbe]" : ""
                    }`}
                  />
                </button>

                {/* Lista de Cards */}
                {showProposals && (
                  <div className="mt-4 space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
                    {isLoadingProposals ? (
                      <div className="flex items-center justify-center py-8 text-slate-500 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />{" "}
                        Carregando...
                      </div>
                    ) : proposals.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-slate-700 rounded-2xl bg-slate-900/30">
                        <p className="text-slate-500 text-sm">
                          Compartilhe seu projeto para receber propostas mais
                          rápido.
                        </p>
                      </div>
                    ) : (
                      proposals.map((proposal) => (
                        <div
                          key={proposal.id}
                          className="bg-slate-900 border border-white/5 rounded-2xl p-5 hover:border-[#d73cbe]/40 transition-all shadow-lg hover:shadow-[#d73cbe]/5 group"
                        >
                          {/* Topo do Card: Info Profissional + Preço */}
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                            {/* Profissional */}
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-lg font-bold text-slate-300 group-hover:border-[#d73cbe]/50 transition-colors">
                                {proposal.professional.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-white text-base">
                                  {proposal.professional.name}
                                </p>
                                <div className="flex items-center gap-1.5 text-xs bg-slate-800/50 px-2 py-0.5 rounded-md w-fit mt-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  <span className="text-yellow-500 font-bold">
                                    {proposal.professional.rating?.toFixed(1) ||
                                      "5.0"}
                                  </span>
                                  <span className="text-slate-600">|</span>
                                  <span className="text-slate-400">
                                    Profissional
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Valor e Prazo (Caixa de Destaque) */}
                            <div className="flex items-center gap-3 bg-slate-950/80 p-2 rounded-xl border border-white/5">
                              <div className="text-right px-2 border-r border-white/10">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">
                                  Valor
                                </p>
                                <p className="text-[#d73cbe] font-bold font-mono text-lg">
                                  R${" "}
                                  {parseFloat(proposal.price).toLocaleString(
                                    "pt-BR",
                                    { minimumFractionDigits: 2 }
                                  )}
                                </p>
                              </div>
                              <div className="text-right px-1">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">
                                  Entrega
                                </p>
                                <div className="flex items-center justify-end gap-1 text-white font-bold text-sm">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {proposal.estimatedDays} dias
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Carta de Apresentação (Balão) */}
                          <div className="relative bg-slate-800/30 p-4 rounded-xl rounded-tl-none border border-white/5 mb-5 ml-4">
                            <Quote className="absolute -top-2 -left-2 w-4 h-4 text-slate-600 fill-current" />
                            <p className="text-sm text-slate-300 italic leading-relaxed">
                              "{proposal.coverLetter}"
                            </p>
                          </div>

                          {/* Ações */}
                          <div className="grid grid-cols-2 gap-3">
                            <Link
                              href={`/dashboard/chat?newChat=${proposal.professionalId}&projectId=${project.id}`}
                              className="w-full"
                            >
                              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors border border-white/5">
                                <MessageSquare className="w-4 h-4" />
                                Negociar
                              </button>
                            </Link>

                            <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black text-xs font-bold transition-all shadow-lg shadow-green-900/20 hover:shadow-green-500/20 transform hover:-translate-y-0.5">
                              <CheckCircle2 className="w-4 h-4" />
                              ACEITAR PROPOSTA
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* --- CONTEÚDO NORMAL DO PROJETO (Escopo) --- */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-slate-200 font-bold text-sm uppercase tracking-wider">
                <div className="w-1 h-4 bg-[#d73cbe] rounded-full" />
                Escopo do Projeto
              </div>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium border border-white/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> Orçamento Estimado
                </p>
                <p className="text-lg font-bold text-white">{budgetLabel}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Prazo Desejado
                </p>
                <p className="text-lg font-bold text-white">{deadline}</p>
              </div>
            </div>
          </div>

          {/* --- FOOTER --- */}
          <div className="p-6 border-t border-white/5 bg-[#0B1121] flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
            >
              Fechar
            </button>
            {allowProposal && project.status === "OPEN" && !isOwner && (
              <button
                onClick={() => setIsProposalModalOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold text-sm shadow-lg shadow-purple-900/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> Enviar Proposta
              </button>
            )}
          </div>
        </div>
      </div>

      <SendProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        projectId={project.id}
        projectTitle={project.title}
        budgetType={project.budgetType}
        budgetValue={project.budgetValue || 0}
        budgetLabel={project.budgetLabel}
      />
    </>
  );
}

// Badge Helper
function StatusBadge({ status }: { status: string }) {
  if (status === "OPEN") {
    return (
      <span className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-400 uppercase">
        Em Aberto
      </span>
    );
  }
  return (
    <span className="px-2 py-1 rounded bg-slate-500/10 border border-slate-500/20 text-[10px] font-bold text-slate-400 uppercase">
      {status}
    </span>
  );
}
