/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Trash2,
  CalendarClock,
  AlertCircle,
  DollarSign,
  Plus,
  Eye,
  Users,
  Briefcase,
  CheckCircle2, // <--- Importado para o Card de Sucesso
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { NewProjectModal } from "@/modules/projects/components/NewProjectModal";
import { ProjectDetailsModal } from "@/modules/projects/components/ProjectDetailsModal";
import { DelMyProjectsModal } from "@/modules/projects/components/DelMyProjectsModal";
import { deleteProject } from "@/modules/projects/actions/delete-project";
import Link from "next/link";
import { toast } from "sonner";

interface MyProjectsViewProps {
  initialProjects: any[];
  isSuccessPayment?: boolean; // <--- Nova propriedade
}

export default function MyProjectsView({
  initialProjects,
  isSuccessPayment,
}: MyProjectsViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Estados
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Estados para Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Limpa a URL se o pagamento foi sucesso (remove o ?success=true)
  useEffect(() => {
    if (isSuccessPayment) {
      window.history.replaceState(null, "", "/dashboard/meus-projetos");
    }
  }, [isSuccessPayment]);

  useGSAP(
    () => {
      gsap.fromTo(
        ".gsap-project-card",
        { y: 30, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.15,
          ease: "back.out(1.2)",
        },
      );
    },
    { scope: containerRef },
  );

  const handleOpenDetails = (project: any) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  const handleOpenDelete = (project: any) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    const result = await deleteProject(projectToDelete.id);

    if (result.success) {
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
      router.refresh();
      toast.success("Projeto excluído com sucesso.");
    } else {
      console.error(result.error);
      toast.error("Erro ao excluir projeto.");
    }
    setIsDeleting(false);
  };

  return (
    <PageContainer>
      <div ref={containerRef} className="space-y-8">
        {/* --- CARD DE NOTIFICAÇÃO DE SUCESSO DO STRIPE --- */}
        {isSuccessPayment && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-4 shadow-lg shadow-emerald-900/10">
            <div className="bg-emerald-500/20 p-3 rounded-full shrink-0">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-emerald-400 font-bold text-lg mb-1">
                Pagamento Aprovado!
              </h4>
              <p className="text-emerald-200/80 text-sm leading-relaxed">
                Seu pagamento foi processado com segurança pela Stripe. O
                projeto já está em andamento e o profissional será notificado
                para iniciar os trabalhos imediatamente.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-futura">
              Meus Pedidos
            </h1>
            <p className="text-slate-400 text-sm">
              Gerencie os projetos que você publicou na plataforma.
            </p>
          </div>
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="bg-[#d73cbe] hover:bg-[#b0269a] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 text-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Pedido
          </button>
        </div>

        {/* Grid de Projetos */}
        {initialProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialProjects.map((project) => (
              <div
                key={project.id}
                className="gsap-project-card bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-[#d73cbe]/30 transition-all group relative overflow-hidden min-h-[300px]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#d73cbe]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Badge de Propostas (Só se estiver em aberto) */}
                {project.status === "OPEN" && project._count?.proposals > 0 && (
                  <div className="absolute top-6 right-16 px-2.5 py-1 rounded-full bg-[#d73cbe] text-white text-[10px] font-bold shadow-lg shadow-[#d73cbe]/30 flex items-center gap-1 animate-pulse z-10">
                    <Users className="w-3 h-3" />
                    {project._count.proposals} Proposta
                    {project._count.proposals > 1 ? "s" : ""}
                  </div>
                )}

                {/* Topo */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <StatusBadge status={project.status} />

                    {project.status === "OPEN" && (
                      <button
                        onClick={() => handleOpenDelete(project)}
                        className="text-slate-500 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-lg hover:bg-red-500/10 z-20"
                        title="Excluir projeto"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight min-h-[3.5rem]">
                      {project.title}
                    </h3>

                    {/* Mostra o Profissional se já tiver */}
                    {project.professional ? (
                      <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs border border-white/10 shrink-0">
                          {project.professional.name
                            ? project.professional.name.charAt(0)
                            : "P"}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-bold text-white truncate">
                            {project.professional.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            Profissional Contratado
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Se não tiver profissional, mostra o aviso
                      <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/30 text-slate-500 text-xs">
                        <AlertCircle className="w-4 h-4" />
                        Aguardando propostas...
                      </div>
                    )}
                  </div>

                  <div className="mb-6 grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" /> Prazo
                      </p>
                      <p className="text-sm font-bold text-slate-200 truncate">
                        {project.deadline || "A definir"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Valor
                      </p>
                      <p className="text-sm font-bold text-slate-200">
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
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <button
                    onClick={() => handleOpenDetails(project)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors border border-white/5 cursor-pointer ${
                      !project.professional ? "col-span-2" : ""
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Ver Detalhes
                  </button>

                  {/* Link do Chat (Só se tiver profissional) */}
                  {project.professional && (
                    <Link
                      href={`/dashboard/chat?newChat=${project.professional.id}&projectId=${project.id}`}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#d73cbe]/10 hover:bg-[#d73cbe] text-[#d73cbe] hover:text-white text-xs font-bold transition-all border border-[#d73cbe]/20 hover:border-[#d73cbe] cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Chat
                    </Link>
                  )}
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
              Nenhum projeto ainda
            </h3>
            <p className="text-slate-400 max-w-md mb-6">
              Você ainda não publicou nenhum projeto. Crie um agora para
              encontrar os melhores profissionais.
            </p>
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="bg-[#d73cbe] hover:bg-[#b0269a] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg cursor-pointer"
            >
              Publicar Primeiro Projeto
            </button>
          </div>
        )}

        {/* Modal de Criação */}
        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
        />

        {/* Modal de Detalhes */}
        <ProjectDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          project={selectedProject}
          isOwner={true}
        />

        {/* Modal de Exclusão */}
        <DelMyProjectsModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          projectTitle={projectToDelete?.title || ""}
          isLoading={isDeleting}
        />
      </div>
    </PageContainer>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "OPEN") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] font-bold text-green-400 uppercase tracking-wide">
          Em Aberto
        </span>
      </div>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">
          Em Andamento
        </span>
      </div>
    );
  }
  if (status === "WAITING_PAYMENT") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
        <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wide">
          Pagamento Pendente
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
