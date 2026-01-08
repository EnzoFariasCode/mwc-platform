"use client";

import { PageContainer } from "@/components/dashboard/PageContainer";
import { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  CalendarClock,
  CheckCircle2,
  DollarSign,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import { ProjectDetailsModal } from "@/components/dashboard/ProjectDetailsModal";

// --- DADOS MOCKADOS (Apenas Projetos ACEITOS/EM ANDAMENTO) ---
const ACTIVE_PROJECTS = [
  {
    id: 1,
    title: "E-commerce de Moda Fitness",
    // Note que aqui temos dados do PROJETO contratado, não da proposta
    professional: {
      // No caso, o profissional é VOCÊ (o usuário logado), então mostramos o Cliente
      name: "Boutique Fit",
      role: "Cliente",
      avatarInitials: "BF",
      color: "bg-purple-600",
    },
    status: "in_progress",
    startDate: "10/01/2026",
    deadline: "12/02/2026",
    price: "R$ 4.500",
    description: "Desenvolvimento completo de loja virtual...",
    lastUpdate: "Há 2 horas",
  },
  {
    id: 4,
    title: "App de Delivery (Clone iFood)",
    professional: {
      name: "Hamburgueria Top",
      role: "Cliente",
      avatarInitials: "HT",
      color: "bg-orange-500",
    },
    status: "in_progress",
    startDate: "05/01/2026",
    deadline: "20/02/2026",
    price: "R$ 12.000",
    description: "App mobile flutter para delivery.",
    lastUpdate: "Ontem",
  },
];

export default function ProjetosAtivosPage() {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleOpenDetails = (project: any) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
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
              Trabalhos em andamento. Mantenha os prazos e a comunicação em dia.
            </p>
          </div>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ACTIVE_PROJECTS.map((project) => (
            <div
              key={project.id}
              className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-green-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-wide">
                      Em Andamento
                    </span>
                  </div>
                  <button className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-4 line-clamp-2 leading-tight min-h-[3.5rem]">
                    {project.title}
                  </h3>

                  {/* Card do Cliente */}
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
                        Contratante
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
                  onClick={() => handleOpenDetails(project)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors border border-white/5 cursor-pointer"
                >
                  Ver Detalhes
                </button>
                <Link
                  href="/dashboard/chat"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white text-xs font-bold transition-all border border-green-500/20 hover:border-green-500 cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  Chat
                </Link>
              </div>
            </div>
          ))}
        </div>

        <ProjectDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          project={selectedProject}
        />
      </div>
    </PageContainer>
  );
}
