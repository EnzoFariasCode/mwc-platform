/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import Link from "next/link";
import {
  DollarSign,
  Eye,
  FileText,
  MessageCircle,
  Search,
  UserCheck,
} from "lucide-react";
import { UpgradeBanner } from "@/modules/billing/components/UpgradeBanner";

// Server Component (Async)
export default async function ProfissionalDashboard() {
  // 1. Autenticação
  const session = await verifySession();

  if (!session || !session.sub) {
    redirect("/login");
  }

  const userId = session.sub as string;

  // 2. Buscando dados reais em paralelo
  const [conversationsCount, proposalsCount, completedProjects, currentUser] =
    await Promise.all([
      // Leads (Conversas)
      db.conversation.count({
        where: {
          OR: [{ participantAId: userId }, { participantBId: userId }],
        },
      }),

      // Propostas Enviadas
      db.proposal.count({
        where: { professionalId: userId },
      }),

      // Ganhos (Apenas de projetos completados)
      db.project.findMany({
        where: {
          professionalId: userId,
          status: "COMPLETED",
          agreedPrice: { not: null },
        },
        select: { agreedPrice: true },
      }),

      // Buscar dados do usuário (Status Stripe e as Visitas reais)
      db.user.findUnique({
        where: { id: userId },
        select: {
          stripeSubscriptionStatus: true,
          profileViews: true, // <--- Lendo as visitas reais do banco
        },
      }),
    ]);

  // 3. Cálculos
  const totalEarnings = completedProjects.reduce((acc, project) => {
    return acc + (Number(project.agreedPrice) || 0);
  }, 0);

  const formattedEarnings = totalEarnings.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Puxa as visitas reais (se for null ou indefinido, cai para 0)
  const profileVisits = currentUser?.profileViews || 0;

  // Verifica se é pro
  const isPro = currentUser?.stripeSubscriptionStatus === "active";

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
            value={profileVisits}
            subtext="Total acumulado"
            color="text-blue-400"
          />
          <StatCard
            icon={MessageCircle}
            label="Leads Diretos"
            value={conversationsCount}
            subtext="Conversas ativas"
            color="text-green-400"
          />
          <StatCard
            icon={FileText}
            label="Propostas Enviadas"
            value={proposalsCount}
            color="text-yellow-400"
          />
          <StatCard
            icon={DollarSign}
            label="Total Ganhos"
            value={formattedEarnings}
            color="text-[#d73cbe]"
          />
        </div>

        {/* BANNER INTELIGENTE (PRO vs FREE) */}
        <UpgradeBanner isPro={isPro} />
      </div>
    </PageContainer>
  );
}

// Componente visual simples para os cards
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
