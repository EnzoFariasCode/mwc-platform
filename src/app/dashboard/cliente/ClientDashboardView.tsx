"use client";

import { PageContainer } from "@/components/dashboard/PageContainer";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // <--- 1. Import necessário
import {
  Briefcase,
  Megaphone,
  MessageCircle,
  Plus,
  Search,
  Zap,
  Loader2,
} from "lucide-react";
import { NewProjectModal } from "@/components/dashboard/NewProjectModal";
import { becomeProfessional } from "@/actions/account/become-professional";
import { BecomeProfessionalModal } from "@/components/dashboard/BecomeProfessionalModal";

interface ClientDashboardViewProps {
  stats: {
    unreadMessages: number;
    openProjects: number;
    ongoingProjects: number;
  };
}

export default function ClientDashboardView({
  stats,
}: ClientDashboardViewProps) {
  const router = useRouter(); // <--- 2. Inicializa o router

  // Estado para o Modal de Novo Projeto
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Estado para o Modal de Virar Profissional
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirmUpgrade = () => {
    startTransition(async () => {
      // 3. Captura o resultado e redireciona se der certo
      const result = await becomeProfessional();

      if (result.success) {
        setIsUpgradeModalOpen(false); // Fecha o modal
        router.push("/dashboard/perfil"); // Vai para o perfil (agora desbloqueado)
      } else {
        // Opcional: Tratar erro aqui
        console.error("Erro ao virar profissional");
      }
    });
  };

  return (
    <PageContainer>
      {/* 1. Modal de Virar Profissional */}
      <BecomeProfessionalModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onConfirm={handleConfirmUpgrade}
        isLoading={isPending}
      />

      {/* 2. Modal de Novo Projeto */}
      <NewProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />

      <div className="space-y-8 animate-fade-in">
        {/* --- HEADER DO CLIENTE --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-futura">
              Visão Geral
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-slate-400 text-sm">Painel do Cliente</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/search">
              <button className="px-6 py-3 bg-slate-800 text-white hover:bg-slate-700 font-bold rounded-xl transition-all border border-slate-700 flex items-center gap-2 cursor-pointer">
                <Search className="w-4 h-4" />
                Buscar Profissionais
              </button>
            </Link>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="px-6 py-3 bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Pedido
            </button>
          </div>
        </div>

        {/* --- CARDS DE ESTATÍSTICAS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={MessageCircle}
            label="Mensagens não lidas"
            value={stats.unreadMessages.toString()}
            color="text-green-400"
          />
          <StatCard
            icon={Megaphone}
            label="Pedidos Abertos"
            value={stats.openProjects.toString()}
            color="text-[#d73cbe]"
          />
          <StatCard
            icon={Briefcase}
            label="Serviços em Andamento"
            value={stats.ongoingProjects.toString()}
            color="text-blue-400"
          />
        </div>

        {/* --- BANNER DE UPGRADE --- */}
        <div className="bg-gradient-to-br from-purple-900/40 to-slate-900 rounded-2xl p-8 border border-purple-500/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-start gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl mb-2">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">
              Você também é um especialista?
            </h3>
            <p className="text-slate-300 max-w-lg leading-relaxed">
              Use sua mesma conta para oferecer serviços. Ative seu perfil
              profissional e apareça nas buscas.
            </p>

            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              disabled={isPending}
              className="mt-2 bg-[#d73cbe] hover:bg-[#b0269a] disabled:opacity-70 text-white px-6 py-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Atualizando...
                </>
              ) : (
                "Mudar para modo Profissional"
              )}
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

// Componente Visual do Card
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
