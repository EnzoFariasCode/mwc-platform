"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  DollarSign,
  FileText,
  Star,
  Search,
  Plus,
  Zap,
  ArrowRight,
  Megaphone,
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { NewProjectModal } from "@/components/dashboard/NewProjectModal";

export default function DashboardHome() {
  const { userType, toggleUserType } = useDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- RENDERIZAÇÃO: VISÃO DO PROFISSIONAL ---
  if (userType === "professional") {
    return (
      // WRAPPER DE SCROLL E PADDING (Adicionado)
      <div className="h-full overflow-y-auto p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
          {/* Header Pro */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white font-futura">
                Visão Geral
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-slate-400 text-sm">
                  Modo Profissional Ativo
                </p>
              </div>
            </div>
            {/* Botão de Ação Principal do Pro */}
            <Link href="/dashboard/encontrar-projetos">
              <button className="px-6 py-3 bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 hover:-translate-y-1 flex items-center gap-2 cursor-pointer">
                <Search className="w-4 h-4" />
                Encontrar Projetos
              </button>
            </Link>
          </div>

          {/* Cards de Resumo (Stats) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={DollarSign}
              label="Total Ganhos"
              value="R$ 1.250,00"
              color="text-[#d73cbe]"
            />
            <StatCard
              icon={Briefcase}
              label="Projetos Ativos"
              value="3"
              color="text-blue-400"
            />
            <StatCard
              icon={FileText}
              label="Propostas Enviadas"
              value="12"
              color="text-yellow-400"
            />
            <StatCard
              icon={Star}
              label="Minha Nota"
              value="4.9"
              color="text-green-400"
            />
          </div>

          {/* Banner Motivacional */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 border border-white/5 relative overflow-hidden group">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                Buscando novos desafios?
              </h2>
              <p className="text-slate-400 mb-6">
                Existem centenas de clientes publicando projetos agora. Envie
                uma proposta e feche negócio.
              </p>
              <Link href="/dashboard/encontrar-projetos">
                <span className="text-[#d73cbe] font-bold hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
                  Ir para o Feed de Projetos <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#d73cbe]/5 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERIZAÇÃO: VISÃO DO CLIENTE ---
  return (
    // WRAPPER DE SCROLL E PADDING (Adicionado)
    <div className="h-full overflow-y-auto p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
        {/* Header Cliente */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-futura">
              Visão Geral
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-slate-400 text-sm">Modo Cliente Ativo</p>
            </div>
          </div>
          {/* Botão de Ação Principal do Cliente: Novo Projeto */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Projeto
          </button>
        </div>

        {/* Cards de Resumo Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={Megaphone}
            label="Projetos Publicados"
            value="5"
            color="text-[#d73cbe]"
          />
          <StatCard
            icon={Star}
            label="Minha Nota (Cliente)"
            value="5.0"
            color="text-yellow-400"
          />
          <StatCard
            icon={Briefcase}
            label="Projetos em Andamento"
            value="2"
            color="text-blue-400"
          />
        </div>

        {/* Convite para assinar plano */}
        <div className="bg-gradient-to-br from-purple-900/40 to-slate-900 rounded-2xl p-8 border border-purple-500/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-start gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl mb-2">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">
              Também quer vender seus serviços?
            </h3>
            <p className="text-slate-300 max-w-lg leading-relaxed">
              Torne-se um profissional na MWC Jobs, assine o plano Starter e
              comece a enviar propostas hoje mesmo.
            </p>
            <button
              onClick={toggleUserType}
              className="mt-2 bg-[#d73cbe] hover:bg-[#b0269a] text-white px-6 py-2 rounded-lg font-bold transition-colors cursor-pointer"
            >
              Virar Profissional
            </button>
          </div>
        </div>

        {/* MODAL */}
        <NewProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}

// Componente visual simples para os Cards
function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">{label}</h3>
          <p className="text-2xl font-bold text-white font-futura">{value}</p>
        </div>
      </div>
    </div>
  );
}
