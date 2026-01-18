import { db } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

// Server Component (Async)
export default async function ProfissionalDashboard() {
  // 1. Autenticação
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  if (!session || !session.sub) {
    redirect("/login");
  }

  const userId = session.sub as string;

  // 2. Buscando dados reais em paralelo
  const [conversationsCount, proposalsCount, completedProjects] =
    await Promise.all([
      // Leads Diretos: Conversas onde sou Participante A ou B
      db.conversation.count({
        where: {
          OR: [{ participantAId: userId }, { participantBId: userId }],
        },
      }),

      // Propostas Enviadas
      db.proposal.count({
        where: {
          professionalId: userId,
        },
      }),

      // Ganhos: Projetos FINALIZADOS onde fui o profissional
      db.project.findMany({
        where: {
          professionalId: userId,
          status: "COMPLETED", // Só conta dinheiro de projeto entregue
          agreedPrice: { not: null }, // Garante que tem valor
        },
        select: {
          agreedPrice: true,
        },
      }),
    ]);

  // 3. Cálculo de Ganhos
  const totalEarnings = completedProjects.reduce((acc, project) => {
    return acc + (Number(project.agreedPrice) || 0);
  }, 0);

  const formattedEarnings = totalEarnings.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // * Visitas no Perfil: Mantido mockado pois ainda não temos analytics de profile views
  const profileVisits = 128;

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

        {/* Cards Pro - Agora com DADOS REAIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Eye}
            label="Visitas no Perfil"
            value={profileVisits}
            subtext="Esta semana"
            color="text-blue-400"
          />
          <StatCard
            icon={MessageCircle}
            label="Leads Diretos"
            value={conversationsCount} // Dados reais do banco
            subtext="Conversas ativas"
            color="text-green-400"
          />
          <StatCard
            icon={FileText}
            label="Propostas Enviadas"
            value={proposalsCount} // Dados reais do banco
            color="text-yellow-400"
          />
          <StatCard
            icon={DollarSign}
            label="Total Ganhos"
            value={formattedEarnings} // Calculado com base em projetos COMPLETED
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
