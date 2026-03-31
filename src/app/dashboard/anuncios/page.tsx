"use client";

import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  DollarSign,
  Plus,
  Megaphone,
  Loader2,
} from "lucide-react";
import gsap from "gsap";
import { useDashboard } from "@/context/DashboardContext";
import { NewProjectModal } from "@/modules/projects/components/NewProjectModal";
import { EditProjectModal } from "@/modules/projects/components/EditProjectModal";
import {
  getMyOpenAds,
  type MyAd,
} from "@/modules/projects/actions/get-my-ads";

export default function MeusAnunciosPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewMode } = useDashboard();

  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<MyAd | null>(null);
  const [ads, setAds] = useState<MyAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAds = useCallback(async () => {
    setIsLoading(true);
    const result = await getMyOpenAds();
    if (result.success) {
      setAds(result.data || []);
    } else {
      setAds([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAds();
  }, [loadAds]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (ads.length === 0) return;

    const cards = containerRef.current.querySelectorAll(".gsap-ad-card");
    if (!cards.length) return;

    gsap.fromTo(
      cards,
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
  }, [ads.length]);

  const handleOpenDetails = (project: MyAd) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  const formatPostedAt = (iso: string) => {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Hoje";
    if (date.toDateString() === yesterday.toDateString()) return "Ontem";

    return date.toLocaleDateString("pt-BR");
  };

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

        {isLoading ? (
          <div className="flex items-center justify-center h-56">
            <Loader2 className="w-8 h-8 text-[#d73cbe] animate-spin" />
          </div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-white/5 border-dashed rounded-2xl text-center">
            <div className="p-4 bg-slate-800 rounded-full mb-4">
              <Megaphone className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Nenhum anúncio aberto
            </h3>
            <p className="text-slate-400 max-w-md mb-6">
              Publique um projeto para começar a receber propostas.
            </p>
            <button
              onClick={() => setIsNewProjectOpen(true)}
              className="bg-[#d73cbe] hover:bg-[#b0269a] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg cursor-pointer"
            >
              Criar Primeiro Anúncio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="gsap-ad-card bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-[#d73cbe]/30 transition-all group relative overflow-hidden min-h-[320px]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#d73cbe]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                      <Megaphone className="w-3 h-3 text-green-400" />
                      <span className="text-[10px] font-bold text-green-400 uppercase tracking-wide">
                        Aberto
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-4 leading-tight min-h-[3.5rem] line-clamp-2">
                    {ad.title}
                  </h3>

                  <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-2 rounded-lg border border-white/5 w-fit mb-6">
                    <Users className="w-4 h-4 text-[#d73cbe]" />
                    <div>
                      <p className="text-lg font-bold text-white leading-none">
                        {ad.proposalsCount}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase">
                        Propostas
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Publicado
                      </p>
                      <p className="text-sm font-bold text-slate-200">
                        {formatPostedAt(ad.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Orçamento
                      </p>
                      <p className="text-sm font-bold text-slate-200">
                        {ad.budgetLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <button
                    onClick={() => handleOpenDetails(ad)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors border border-white/5 cursor-pointer"
                  >
                    Ver Detalhes
                  </button>
                  <Link
                    href="/dashboard/meus-projetos"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#d73cbe]/10 hover:bg-[#d73cbe] text-[#d73cbe] hover:text-white text-xs font-bold transition-all border border-[#d73cbe]/20 hover:border-[#d73cbe] cursor-pointer"
                  >
                    Ver Propostas
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <NewProjectModal
          isOpen={isNewProjectOpen}
          onClose={() => setIsNewProjectOpen(false)}
          onCreated={loadAds}
        />

        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          onUpdated={loadAds}
        />
      </div>
    </PageContainer>
  );
}
