/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  CalendarClock,
  DollarSign,
  MoreVertical,
  Briefcase,
  UploadCloud, // <--- Ícone Novo
  Star,
} from "lucide-react";
import { ProjectDetailsModal } from "@/modules/projects/components/ProjectDetailsModal";
import { DeliverProjectModal } from "@/modules/projects/components/DeliverProjectModal"; // <--- Import Novo
import { ReviewModal } from "@/modules/reviews/components/ReviewModal";
import { submitReview } from "@/modules/reviews/actions/submit-review";

interface ActiveProjectsViewProps {
  projects: any[];
}

export default function ActiveProjectsView({
  projects,
}: ActiveProjectsViewProps) {
  // Estado para Detalhes
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Estado para Entrega (Novo)
  const [projectToDeliver, setProjectToDeliver] = useState<any>(null);
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [projectToReview, setProjectToReview] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleOpenDetails = (project: any) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  const handleOpenDelivery = (project: any) => {
    setProjectToDeliver(project);
    setIsDeliverModalOpen(true);
  };

  const handleOpenReview = (project: any) => {
    setProjectToReview(project);
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (rating: number, comment?: string) => {
    if (!projectToReview?.id) {
      return { success: false, error: "Projeto invalido." };
    }
    return submitReview(projectToReview.id, rating, comment);
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-futura">
              Projetos Ativos
            </h1>
            <p className="text-slate-400 text-sm">
              Trabalhos em andamento e finalizados aguardando avaliação.
            </p>
          </div>
        </div>

        {/* Grid de Cards */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-green-500/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div>
                  <div className="flex items-start justify-between mb-4">
                    <StatusBadge status={project.status} />
                    <button className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-4 line-clamp-2 leading-tight min-h-[3.5rem]">
                      {project.title}
                    </h3>

                    {/* Card do Cliente (Dono do projeto) */}
                    <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs border border-white/10 shrink-0">
                        {project.owner.name.charAt(0)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">
                          {project.owner.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          Cliente (Contratante)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" /> Prazo
                      </p>
                      <p className="text-sm font-bold text-slate-200">
                        {project.deadline}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Valor Fechado
                      </p>
                      <p className="text-sm font-bold text-green-400">
                        {project.agreedPrice
                          ? Number(project.agreedPrice).toLocaleString(
                              "pt-BR",
                              { style: "currency", currency: "BRL" },
                            )
                          : project.budgetLabel}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="mt-auto space-y-3">
                  {/* Botão de Entregar (Apenas se IN_PROGRESS) */}
                  {project.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => handleOpenDelivery(project)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#d73cbe] hover:bg-[#b0269a] text-white text-xs font-bold transition-all shadow-lg shadow-purple-900/20 cursor-pointer animate-in fade-in"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Entregar Projeto
                    </button>
                  )}

                  {project.status === "COMPLETED" &&
                    (!project.reviews || project.reviews.length === 0) && (
                      <button
                        onClick={() => handleOpenReview(project)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-xs font-bold transition-all border border-yellow-500/20 cursor-pointer animate-in fade-in"
                      >
                        <Star className="w-4 h-4" />
                        Avaliar Cliente
                      </button>
                    )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleOpenDetails(project)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors border border-white/5 cursor-pointer"
                    >
                      Ver Detalhes
                    </button>
                    <Link
                      href={`/dashboard/chat?newChat=${project.ownerId}&projectId=${project.id}`}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white text-xs font-bold transition-all border border-green-500/20 hover:border-green-500 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Chat
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Estado Vazio
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-white/5 border-dashed rounded-2xl text-center">
            <div className="p-4 bg-slate-800 rounded-full mb-4">
              <Briefcase className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Nenhum projeto em andamento
            </h3>
            <p className="text-slate-400 max-w-md">
              Quando um cliente aceitar sua proposta, o projeto aparecerá aqui
              para você iniciar o trabalho.
            </p>
          </div>
        )}

        {/* Modal de Detalhes */}
        <ProjectDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          project={selectedProject}
          allowProposal={false}
          isOwner={false}
        />

        {/* Modal de Entrega */}
        <DeliverProjectModal
          isOpen={isDeliverModalOpen}
          onClose={() => setIsDeliverModalOpen(false)}
          projectId={projectToDeliver?.id}
          projectTitle={projectToDeliver?.title}
        />

        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title="Avalie o Cliente"
          subtitle={`Como foi trabalhar com ${
            projectToReview?.owner?.name || "este cliente"
          }?`}
          confirmLabel="Enviar Avaliacao"
          onConfirm={handleSubmitReview}
        />
      </div>
    </PageContainer>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "IN_PROGRESS") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] font-bold text-green-400 uppercase tracking-wide">
          Em Andamento
        </span>
      </div>
    );
  }
  if (status === "WAITING_PAYMENT") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wide">
          Aguardando Pagamento
        </span>
      </div>
    );
  }
  if (status === "UNDER_REVIEW") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">
          Em Revisão
        </span>
      </div>
    );
  }
  if (status === "COMPLETED") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">
          Concluído
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/20">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
        {status}
      </span>
    </div>
  );
}
