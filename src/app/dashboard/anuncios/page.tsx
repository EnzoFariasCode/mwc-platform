/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { useRef, useState } from "react";
import {
  Eye,
  MoreHorizontal,
  Calendar,
  Users,
  DollarSign,
  Plus,
  Megaphone,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useDashboard } from "@/context/DashboardContext";
import { NewProjectModal } from "@/modules/projects/components/NewProjectModal";
import { EditProjectModal } from "@/modules/projects/components/EditProjectModal"; // Importe o novo modal

// --- DADOS MOCKADOS (Anúncios Abertos / Recebendo Propostas) ---
const OPEN_ADS = [
  {
    id: 101,
    title: "Criação de Logo e Identidade Visual para Startup",
    proposals: 12,
    status: "open", // open, paused
    postedAt: "12/01/2026",
    budget: "R$ 1.500",
    views: 145,
  },
  {
    id: 102,
    title: "Redator para Blog de Tecnologia (4 artigos/mês)",
    proposals: 3,
    status: "open",
    postedAt: "Hoje",
    budget: "R$ 400",
    views: 22,
  },
  {
    id: 103,
    title: "Manutenção em Site Wordpress (Bug Fix)",
    proposals: 0,
    status: "open",
    postedAt: "Ontem",
    budget: "R$ 200",
    views: 8,
  },
];

export default function MeusAnunciosPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewMode } = useDashboard();

  // Estados dos Modais
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".gsap-ad-card",
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

  // Função para abrir o modal de edição com os dados do card
  const handleOpenDetails = (project: any) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  // Se for Profissional, não deveria ver isso (proteção simples)
  if (viewMode === "PROFESSIONAL") {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
        <p className="text-slate-400">
          Esta área é exclusiva para gestão de anúncios de clientes.
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
              Meus Anúncios
            </h1>
            <p className="text-slate-400 text-sm">
              Gerencie os projetos que estão recebendo propostas.
            </p>
          </div>

          <button
            onClick={() => setIsNewProjectOpen(true)}
            className="bg-[#d73cbe] hover:bg-[#b0269a] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 text-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Criar Anúncio
          </button>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {OPEN_ADS.map((ad) => (
            <div
              key={ad.id}
              className="gsap-ad-card bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-[#d73cbe]/30 transition-all group relative overflow-hidden min-h-[340px]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#d73cbe]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {/* Topo */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                    <Megaphone className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-wide">
                      Aberto
                    </span>
                  </div>
                  <button className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white mb-4 leading-tight min-h-[3.5rem] line-clamp-2">
                  {ad.title}
                </h3>

                {/* Stats do Anúncio */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-2 rounded-lg border border-white/5">
                    <Users className="w-4 h-4 text-[#d73cbe]" />
                    <div>
                      <p className="text-lg font-bold text-white leading-none">
                        {ad.proposals}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase">
                        Propostas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-lg font-bold text-white leading-none">
                        {ad.views}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase">
                        Visitas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Publicado
                    </p>
                    <p className="text-sm font-bold text-slate-200">
                      {ad.postedAt}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Orçamento
                    </p>
                    <p className="text-sm font-bold text-slate-200">
                      {ad.budget}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button
                  onClick={() => handleOpenDetails(ad)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors border border-white/5 cursor-pointer"
                >
                  Ver Detalhes
                </button>
                <button className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#d73cbe]/10 hover:bg-[#d73cbe] text-[#d73cbe] hover:text-white text-xs font-bold transition-all border border-[#d73cbe]/20 hover:border-[#d73cbe] cursor-pointer">
                  Ver Propostas
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL DE CRIAÇÃO (Botão Novo Projeto) */}
        <NewProjectModal
          isOpen={isNewProjectOpen}
          onClose={() => setIsNewProjectOpen(false)}
        />

        {/* MODAL DE EDIÇÃO (Botão Ver Detalhes) */}
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          project={selectedProject}
        />
      </div>
    </PageContainer>
  );
}
