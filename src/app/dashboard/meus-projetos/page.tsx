"use client";

import { PageContainer } from "@/components/dashboard/PageContainer";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  MoreHorizontal,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Plus,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useDashboard } from "@/context/DashboardContext";
import { NewProjectModal } from "@/components/dashboard/NewProjectModal";
import { ProjectDetailsModal } from "@/components/dashboard/ProjectDetailsModal"; // <--- IMPORTAR O NOVO MODAL

// --- DADOS MOCKADOS ATUALIZADOS ---
const ACTIVE_PROJECTS = [
  {
    id: 1,
    title: "E-commerce de Moda Fitness",
    description:
      "Desenvolvimento completo de loja virtual utilizando Shopify ou WooCommerce, com integração de gateway de pagamento, cálculo de frete e layout responsivo focado em mobile.",
    professional: {
      name: "Ana Beatriz",
      role: "Dev Fullstack",
      avatarInitials: "AB",
      color: "bg-purple-600",
    },
    status: "in_progress",
    startDate: "10/01/2026", // Data do aceite
    deadline: "12/02/2026",
    price: "R$ 4.500",
    lastUpdate: "Há 2 horas",
  },
  {
    id: 3,
    title: "Bot de Atendimento WhatsApp",
    description:
      "Criação de chatbot para automação de atendimento ao cliente, com menu interativo, respostas frequentes e transbordo para atendente humano quando necessário.",
    professional: {
      name: "Marcos V.",
      role: "Backend Dev",
      avatarInitials: "MV",
      color: "bg-emerald-600",
    },
    status: "in_progress",
    startDate: "15/01/2026", // Data do aceite
    deadline: "20/02/2026",
    price: "R$ 1.200",
    lastUpdate: "Ontem",
  },
];

export default function MeusProjetosPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { userType } = useDashboard();

  // Estados para os Modais
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

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

  // Função para abrir detalhes
  const handleOpenDetails = (project: any) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  if (userType === "professional") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="p-4 bg-slate-900 rounded-full border border-white/10">
          <AlertCircle className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-white">Área do Cliente</h2>
        <p className="text-slate-400 max-w-md">
          Alterne para o modo "Sou Cliente" no topo da página para visualizar
          seus projetos contratados.
        </p>
      </div>
    );
  }

  return (
    <PageContainer>
      <div ref={containerRef} className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-futura">
              Projetos em Andamento
            </h1>
            <p className="text-slate-400 text-sm">
              Acompanhe o status e prazos das suas contratações ativas.
            </p>
          </div>
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="bg-[#d73cbe] hover:bg-[#b0269a] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 text-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Projeto
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ACTIVE_PROJECTS.map((project) => (
            <div
              key={project.id}
              className="gsap-project-card bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-[#d73cbe]/30 transition-all group relative overflow-hidden min-h-[340px]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#d73cbe]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {/* Topo do Card */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <StatusBadge status={project.status} />
                  <button className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-4 line-clamp-2 leading-tight min-h-[3.5rem]">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                    <div
                      className={`w-10 h-10 rounded-full ${project.professional.color} flex items-center justify-center text-white font-bold text-xs border border-white/10 shrink-0`}
                    >
                      {project.professional.avatarInitials}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-white truncate">
                        {project.professional.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {project.professional.role}
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
                      <DollarSign className="w-3 h-3" /> Valor
                    </p>
                    <p className="text-sm font-bold text-slate-200">
                      {project.price}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button
                  onClick={() => handleOpenDetails(project)} // <--- AÇÃO AQUI
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors border border-white/5 cursor-pointer"
                >
                  Ver Detalhes
                </button>
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

        {/* MODAL NOVO PROJETO */}
        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
        />

        {/* MODAL DETALHES (Novo) */}
        <ProjectDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          project={selectedProject}
        />
      </div>
    </PageContainer>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "in_progress") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">
          Em Desenvolvimento
        </span>
      </div>
    );
  }
  return null;
}
