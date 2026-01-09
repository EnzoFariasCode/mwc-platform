"use client";

import { PageContainer } from "@/components/dashboard/PageContainer";
import Link from "next/link";
import {
  ArrowRight,
  DollarSign,
  Eye,
  FileText,
  MessageCircle,
  Search,
  UserCheck,
} from "lucide-react";

export default function ProfissionalDashboard() {
  return (
    <PageContainer>
      <div className="space-y-8 animate-fade-in">
        {/* Header Pro */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-futura">
              Visão Geral
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-slate-400 text-sm">
                Seu perfil está visível na busca
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard/perfil">
              <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700 flex items-center gap-2 cursor-pointer">
                <UserCheck className="w-4 h-4" />
                Editar Vitrine
              </button>
            </Link>
            <Link href="/dashboard/encontrar-projetos">
              <button className="px-6 py-3 bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 hover:-translate-y-1 flex items-center gap-2 cursor-pointer">
                <Search className="w-4 h-4" />
                Buscar Oportunidades
              </button>
            </Link>
          </div>
        </div>

        {/* Cards Pro */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Eye}
            label="Visitas no Perfil"
            value="128"
            subtext="Esta semana"
            color="text-blue-400"
          />
          <StatCard
            icon={MessageCircle}
            label="Leads Diretos"
            value="5"
            subtext="Mensagens novas"
            color="text-green-400"
          />
          <StatCard
            icon={FileText}
            label="Propostas Enviadas"
            value="12"
            color="text-yellow-400"
          />
          <StatCard
            icon={DollarSign}
            label="Total Ganhos"
            value="R$ 1.250,00"
            color="text-[#d73cbe]"
          />
        </div>

        {/* Banner Motivacional */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 border border-white/5 relative overflow-hidden group">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              Aumente sua visibilidade
            </h2>
            <p className="text-slate-400 mb-6">
              Profissionais com foto de perfil e portfólio completo recebem 5x
              mais contatos diretos de clientes.
            </p>
            <Link href="/dashboard/perfil">
              <span className="text-[#d73cbe] font-bold hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
                Completar meu Perfil agora <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#d73cbe]/5 to-transparent pointer-events-none" />
        </div>
      </div>
    </PageContainer>
  );
}

// StatCard duplicado aqui ou importado de componente comum
function StatCard({ icon: Icon, label, value, color, subtext }: any) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">{label}</h3>
          <p className="text-2xl font-bold text-white font-futura">{value}</p>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}
