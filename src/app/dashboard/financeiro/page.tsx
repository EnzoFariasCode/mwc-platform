import { PageContainer } from "@/components/dashboard/PageContainer";
import Link from "next/link";
import { injectFakeMoney } from "@/actions/finance/inject-fake-money";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  History,
  Landmark,
  AlertCircle,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import { db } from "@/lib/prisma";
import { getUserSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { WithdrawButton } from "@/components/dashboard/financeiro/WithdrawModal";

// Função auxiliar para formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Componente de Status
function StatusText({ status }: { status: string }) {
  const s = status.toUpperCase();
  if (s === "COMPLETED")
    return <span className="text-green-500">Concluído</span>;
  if (s === "PENDING" || s === "PROCESSING")
    return <span className="text-yellow-500">Em processamento</span>;
  if (s === "FAILED") return <span className="text-red-500">Falhou</span>;
  return <span className="text-muted-foreground">{status}</span>;
}

export default async function FinanceiroPage() {
  // 1. Verificar Sessão
  const session = await getUserSession();
  if (!session) redirect("/login");

  // 2. Buscar Dados Reais no Banco
  const user = await db.user.findUnique({
    where: { id: session.id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" }, // Mais recentes primeiro
        take: 20, // Limitar a 20 últimos para não pesar a página inicial
      },
    },
  });

  if (!user) redirect("/login");

  // 3. Cálculos Financeiros
  const walletBalance = user.walletBalance || 0;

  // Calcula total já ganho na vida (Soma de todos os CREDIT + COMPLETED)
  const allCredits = await db.transaction.aggregate({
    where: {
      userId: user.id,
      type: "CREDIT",
      status: "COMPLETED",
    },
    _sum: { amount: true },
  });
  const totalLifetime = allCredits._sum.amount || 0;

  // Calcula valores pendentes (Soma de CREDIT + PENDING)
  const allPending = await db.transaction.aggregate({
    where: {
      userId: user.id,
      type: "CREDIT",
      status: "PENDING",
    },
    _sum: { amount: true },
  });
  const totalPending = allPending._sum.amount || 0;

  const hasTransactions = user.transactions.length > 0;

  // Tenta preencher o CPF com a pixKey se ela for do tipo CPF, senão deixa vazio
  const userCpf = user.pixKeyType === "CPF" ? user.pixKey : "";

  return (
    <PageContainer>
      {/*  BOTÃO DE INJEÇÃO DE DINHEIRO FALSO (APENAS PARA TESTES) - COMENTADO PARA NÃO APARECER NA INTERFACE FINAL */}

      {/* <form action={injectFakeMoney} className="mb-4">
        <button className="bg-emerald-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors">
          [DEV] Injetar R$ 150,00
        </button>
      </form> */}
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-futura">
              Financeiro
            </h1>
            <p className="text-muted-foreground text-sm">
              Gerencie seus ganhos, saques e histórico de transações.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-muted-foreground text-sm hover:text-foreground transition-colors cursor-pointer">
            <Download className="w-4 h-4" /> Exportar Relatório
          </button>
        </div>

        {/* --- CARDS PRINCIPAIS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Saldo Principal */}
          <div className="lg:col-span-2 bg-gradient-to-br from-primary/20 to-purple-900/20 border border-primary/20 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-32 h-32 text-primary" />
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Saldo Disponível
              </p>
              <h2 className="text-4xl font-bold text-foreground font-futura mt-2">
                {formatCurrency(walletBalance)}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                + {formatCurrency(totalPending)} a liberar em breve
              </p>
            </div>

            <div className="mt-6">
              {/* Componente Cliente para interatividade (Atualizado) */}
              <WithdrawButton
                balance={walletBalance}
                userCpf={userCpf} // Passamos o CPF se já existir
              />
            </div>
          </div>

          {/* Card 2: Resumo Financeiro */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-6">
            {/* Total Ganho */}
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                Total Ganho (Vitalício)
              </p>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(totalLifetime)}
                </span>
              </div>
            </div>

            <div className="h-px bg-border w-full" />

            {/* Conta Vinculada (Informativo Simples) */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Última Conta Usada
                </p>
              </div>

              {user.pixKey ? (
                <div className="flex items-center gap-3 bg-background/50 p-3 rounded-xl border border-border">
                  <div className="p-2 bg-slate-800 rounded-lg text-white">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Pix CPF</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {user.pixKey}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 opacity-70">
                  <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400">
                      Nenhum saque ainda
                    </p>
                    <p className="text-xs text-slate-500">
                      Realize seu primeiro saque.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- EXTRATO / HISTÓRICO --- */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground font-futura flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Histórico de Movimentações
          </h3>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {!hasTransactions ? (
              // --- EMPTY STATE ---
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-bold text-foreground">
                  Nenhuma movimentação ainda
                </h4>
                <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                  Assim que você concluir seu primeiro projeto e o cliente
                  liberar o pagamento, o valor aparecerá aqui.
                </p>
                <Link href="/dashboard/encontrar-projetos">
                  <button className="text-primary font-bold text-sm hover:underline cursor-pointer">
                    Buscar projetos agora
                  </button>
                </Link>
              </div>
            ) : (
              // --- LISTA DE DADOS REAIS ---
              <div className="divide-y divide-border">
                {user.transactions.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icone */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          item.type === "CREDIT"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {item.type === "CREDIT" ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <p className="font-bold text-foreground text-sm">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>
                            {new Date(item.createdAt).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                          <span>•</span>
                          <StatusText status={item.status} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 pl-14 md:pl-0">
                      <span
                        className={`font-bold font-futura ${
                          item.type === "CREDIT"
                            ? "text-green-400"
                            : "text-foreground"
                        }`}
                      >
                        {item.type === "CREDIT" ? "+" : "-"}{" "}
                        {formatCurrency(item.amount)}
                      </span>
                      <button className="text-muted-foreground hover:text-foreground">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
