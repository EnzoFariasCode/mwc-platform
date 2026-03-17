"use client";

import {
  X,
  Calendar,
  DollarSign,
  Send,
  Users,
  ChevronDown,
  CheckCircle2,
  MessageSquare,
  Star,
  Loader2,
  Clock,
  Quote,
  Download,
  ThumbsUp,
  ThumbsDown,
  Hourglass,
  CheckCircle,
  Briefcase,
} from "lucide-react";
import { useState, useEffect } from "react";
import { SendProposalModal } from "./SendProposalModal";
import { getProjectProposals } from "@/actions/proposals/get-project-proposals";
import { approveProject } from "@/actions/proposals/approve-project";
import { toast } from "sonner";
import Link from "next/link";
import { ReviewModal } from "@/components/dashboard/ReviewModal";

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
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [showProposals, setShowProposals] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && isOwner && project?.id && project?.status === "OPEN") {
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

  const handleApprove = async (rating: number, comment?: string) => {
    const result = await approveProject(project.id, rating, comment);

    if (result.success) {
      onClose();
    }

    return result;
  };

  if (!isOpen || !project) return null;

  const budgetLabel = project.budgetLabel || "A combinar";
  const deadline = project.deadline || "Não informado";
  const category = project.category || "Geral";
  const tags = project.tags || [];

  // ========================================================
  // LÓGICA DE DADOS REAIS: Pega a última entrega do banco
  // ========================================================
  const realDeliverable = project.deliverables?.[0];

  const lastDeliverable = {
    link: realDeliverable?.link || "Nenhum link fornecido.",
    description: realDeliverable?.description || "Nenhuma descrição fornecida.",
    date: realDeliverable?.createdAt
      ? new Date(realDeliverable.createdAt).toLocaleDateString("pt-BR")
      : "Data desconhecida",
  };

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
            {/* === CENÁRIO 1: PROJETO EM ANÁLISE (ENTREGUE) === */}
            {isOwner && project.status === "UNDER_REVIEW" && (
              <div className="relative bg-green-500/5 border border-green-500/20 rounded-2xl p-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Projeto Entregue!
                    </h3>
                    <p className="text-sm text-slate-400">
                      O profissional marcou como concluído. Analise os arquivos
                      abaixo e aprove para liberar o pagamento.
                    </p>
                  </div>
                </div>

                {/* Card de Entrega */}
                <div className="bg-slate-950/50 border border-white/10 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Download className="w-4 h-4 text-[#d73cbe]" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-slate-500 uppercase font-bold">
                        Arquivos / Link (Enviado em: {lastDeliverable.date})
                      </p>

                      {/* Tratamento para o Link (verificando se é URL válida) */}
                      {lastDeliverable.link.startsWith("http") ? (
                        <a
                          href={lastDeliverable.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-[#d73cbe] hover:underline break-all block"
                        >
                          {lastDeliverable.link}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-slate-300 break-all block">
                          {lastDeliverable.link}
                        </p>
                      )}

                      <div className="h-px bg-white/5 my-2" />
                      <p className="text-xs text-slate-500 uppercase font-bold">
                        Comentário
                      </p>
                      <p className="text-sm text-slate-300 italic whitespace-pre-wrap">
                        "{lastDeliverable.description}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-xs transition-colors cursor-pointer">
                    <ThumbsDown className="w-4 h-4" /> Solicitar Revisão
                  </button>
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs transition-all shadow-lg shadow-green-900/20 transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                  >
                    <>
                      <ThumbsUp className="w-4 h-4" /> Aprovar e Finalizar
                    </>
                  </button>
                </div>
              </div>
            )}

            {/* === CENÁRIO 4: PROJETO CONCLUÍDO === */}
            {project.status === "COMPLETED" && (
              <div className="space-y-6">
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/20">
                    <CheckCircle className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Projeto Finalizado!
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Pagamento liberado. O projeto foi encerrado com sucesso.
                  </p>
                </div>

                {isOwner && (
                  <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                    <h4 className="text-sm text-slate-300 font-bold uppercase mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#d73cbe]" /> Arquivos
                      da Entrega
                    </h4>
                    <div className="bg-slate-950/50 border border-white/10 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <Download className="w-4 h-4 text-[#d73cbe]" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-xs text-slate-500 uppercase font-bold">
                            Link de Acesso
                          </p>
                          {lastDeliverable.link.startsWith("http") ? (
                            <a
                              href={lastDeliverable.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-[#d73cbe] hover:underline break-all block"
                            >
                              {lastDeliverable.link}
                            </a>
                          ) : (
                            <p className="text-sm font-medium text-slate-300 break-all block">
                              {lastDeliverable.link}
                            </p>
                          )}
                          <div className="h-px bg-white/5 my-2" />
                          <p className="text-xs text-slate-500 uppercase font-bold">
                            Nota do Profissional
                          </p>
                          <p className="text-sm text-slate-300 italic whitespace-pre-wrap">
                            "{lastDeliverable.description}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* === CENÁRIO 2: PROJETO EM ANDAMENTO (AGUARDANDO) === */}
            {isOwner && project.status === "IN_PROGRESS" && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                    <Hourglass className="w-6 h-6 text-blue-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Trabalho em Andamento
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      O profissional já iniciou o serviço. Você será notificado
                      aqui assim que ele enviar os arquivos.
                    </p>
                  </div>
                </div>
                <div className="bg-slate-950/50 rounded-xl p-4 border border-white/10 flex flex-col gap-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {project.professional?.name
                        ? project.professional.name.charAt(0)
                        : "P"}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">
                        Profissional Responsável
                      </p>
                      <p className="text-white font-bold">
                        {project.professional?.name || "Profissional MWC"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">
                        Prazo de Entrega
                      </p>
                      <p className="text-white font-mono">{deadline}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* === CENÁRIO 3: PROJETO EM ABERTO (LISTA DE PROPOSTAS) === */}
            {isOwner && project.status === "OPEN" && (
              <div className="relative">
                <button
                  onClick={() => setShowProposals(!showProposals)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all group relative overflow-hidden ${
                    showProposals
                      ? "bg-slate-900 border-[#d73cbe]/30"
                      : "bg-slate-900/50 border-white/10 hover:border-[#d73cbe]/30"
                  }`}
                >
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
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
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
                                    {proposal.professional.ratingCount &&
                                    proposal.professional.rating
                                      ? proposal.professional.rating.toFixed(1)
                                      : "Novo"}
                                  </span>
                                  {proposal.professional.ratingCount ? (
                                    <span className="text-slate-600">
                                      ({proposal.professional.ratingCount} avaliaÃ§Ãµes)
                                    </span>
                                  ) : null}
                                  <span className="text-slate-600">|</span>
                                  <span className="text-slate-400">
                                    Profissional
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-950/80 p-2 rounded-xl border border-white/5">
                              <div className="text-right px-2 border-r border-white/10">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">
                                  Valor
                                </p>
                                <p className="text-[#d73cbe] font-bold font-mono text-lg">
                                  R${" "}
                                  {parseFloat(proposal.price).toLocaleString(
                                    "pt-BR",
                                    { minimumFractionDigits: 2 },
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
                          <div className="relative bg-slate-800/30 p-4 rounded-xl rounded-tl-none border border-white/5 mb-5 ml-4">
                            <Quote className="absolute -top-2 -left-2 w-4 h-4 text-slate-600 fill-current" />
                            <p className="text-sm text-slate-300 italic leading-relaxed">
                              "{proposal.coverLetter}"
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Link
                              href={`/dashboard/chat?newChat=${proposal.professionalId}&projectId=${project.id}`}
                              className="w-full"
                            >
                              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors border border-white/5">
                                <MessageSquare className="w-4 h-4" /> Negociar
                              </button>
                            </Link>
                            <Link
                              href={`/dashboard/checkout/${proposal.id}`}
                              className="w-full"
                            >
                              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black text-xs font-bold transition-all shadow-lg shadow-green-900/20 hover:shadow-green-500/20 transform hover:-translate-y-0.5">
                                <CheckCircle2 className="w-4 h-4" /> ACEITAR
                                PROPOSTA
                              </button>
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* --- CONTEÚDO COMUM (ESCOPO) --- */}
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

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Avalie o Profissional"
        subtitle={`Como foi trabalhar com ${
          project.professional?.name || "este profissional"
        }?`}
        confirmLabel="Aprovar e Finalizar"
        successMessage="Projeto finalizado com sucesso!"
        errorMessage="Erro ao aprovar."
        onConfirm={handleApprove}
      />
    </>
  );
}

// Badge Helper
function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, any> = {
    OPEN: {
      label: "Em Aberto",
      class: "text-green-400 bg-green-500/10 border-green-500/20",
    },
    IN_PROGRESS: {
      label: "Em Andamento",
      class: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    UNDER_REVIEW: {
      label: "Em Análise",
      class: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    },
    COMPLETED: {
      label: "Concluído",
      class: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
  };

  const style = statusMap[status] || {
    label: status,
    class: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  };

  return (
    <span
      className={`px-2 py-1 rounded border text-[10px] font-bold uppercase ${style.class}`}
    >
      {style.label}
    </span>
  );
}
