"use client";

import { PageContainer } from "@/components/dashboard/PageContainer";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation"; // Importar useRouter para atualizar a lista
import {
  MessageSquare,
  Trash2, // Trocado MoreHorizontal por Trash2
  CalendarClock,
  AlertCircle,
  DollarSign,
  Plus,
  Briefcase,
  Eye,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { NewProjectModal } from "@/components/dashboard/NewProjectModal";
import { ProjectDetailsModal } from "@/components/dashboard/ProjectDetailsModal";
import { DelMyProjectsModal } from "@/components/dashboard/DelMyProjectsModal"; // Importar o novo modal
import { deleteProject } from "@/actions/projects/delete-project"; // Importar a action
import Link from "next/link";
import { toast } from "sonner"; // Opcional: Se tiver toast configurado

interface MyProjectsViewProps {
  initialProjects: any[];
}

export default function MyProjectsView({
  initialProjects,
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
        }
      );
    },
    { scope: containerRef }
  );

  // Função para abrir o modal de detalhes
  const handleOpenDetails = (project: any) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  // Função para abrir o modal de exclusão
  const handleOpenDelete = (project: any) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  // Função para confirmar a exclusão
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    const result = await deleteProject(projectToDelete.id);

    if (result.success) {
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
      router.refresh(); // Atualiza a lista na tela
      // toast.success("Projeto excluído com sucesso!");
    } else {
      console.error(result.error);
      // toast.error("Erro ao excluir projeto.");
    }
    setIsDeleting(false);
  };

  return (
    <PageContainer>
      <div ref={containerRef} className="space-y-8">
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

                {/* Topo */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <StatusBadge status={project.status} />

                    {/* Botão de Lixeira (Substituindo os 3 pontinhos) */}
                    <button
                      onClick={() => handleOpenDelete(project)}
                      className="text-slate-500 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-lg hover:bg-red-500/10"
                      title="Excluir projeto"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight min-h-[3.5rem]">
                      {project.title}
                    </h3>

                    {/* Exibe profissional se já tiver um */}
                    {project.professional ? (
                      <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs border border-white/10 shrink-0">
                          {project.professional.name
                            ? project.professional.name.charAt(0)
                            : "P"}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-bold text-white truncate">
                            {project.professional.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            Profissional Responsável
                          </p>
                        </div>
                      </div>
                    ) : (
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
                        {project.deadline}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Valor
                      </p>
                      <p className="text-sm font-bold text-slate-200">
                        {project.budgetLabel}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <button
                    onClick={() => handleOpenDetails(project)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors border border-white/5 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    Ver Detalhes
                  </button>
                  {/* ------------------------------- */}

                  <Link
                    href="/dashboard/chat"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#d73cbe]/10 hover:bg-[#d73cbe] text-[#d73cbe] hover:text-white text-xs font-bold transition-all border border-[#d73cbe]/20 hover:border-[#d73cbe] cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Chat
                  </Link>
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
        />

        {/* Modal de Exclusão (NOVO) */}
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
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/20">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
        {status}
      </span>
    </div>
  );
}
