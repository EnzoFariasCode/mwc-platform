import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { WithdrawButton } from "@/modules/finance/components/WithdrawModal";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  ChevronRight,
  Download,
  History,
  Landmark,
  Percent,
  Wallet,
} from "lucide-react";

const PLATFORM_FEE_PERCENT = 10;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function statusText(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "COMPLETED") {
    return <span className="text-emerald-400">Concluido</span>;
  }
  if (normalized === "PENDING" || normalized === "PROCESSING") {
    return <span className="text-yellow-400">Em processamento</span>;
  }
  if (normalized === "FAILED") {
    return <span className="text-red-400">Falhou</span>;
  }
  return <span className="text-slate-400">{status}</span>;
}

export default async function HealthFinanceiroPage() {
  const session = await auth();

  if (
    !session?.user?.id ||
    session.user.userType !== "PROFESSIONAL" ||
    session.user.industry !== "HEALTH"
  ) {
    redirect("/portal");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      walletBalance: true,
      pixKey: true,
      pixKeyType: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      proAppointments: {
        where: { status: { not: "CANCELED" } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          date: true,
          time: true,
          price: true,
          patient: {
            select: {
              name: true,
              displayName: true,
            },
          },
        },
      },
    },
  });

  if (!user) redirect("/portal");

  const walletBalance = user.walletBalance.toNumber();
  const grossHealthRevenue = user.proAppointments.reduce(
    (total, appointment) => total + appointment.price.toNumber(),
    0,
  );
  const platformFeeTotal = grossHealthRevenue * (PLATFORM_FEE_PERCENT / 100);
  const netHealthRevenue = grossHealthRevenue - platformFeeTotal;

  const completedCredits = user.transactions
    .filter((item) => item.type === "CREDIT" && item.status === "COMPLETED")
    .reduce((total, item) => total + item.amount.toNumber(), 0);

  const pendingWithdrawals = user.transactions
    .filter((item) => item.type === "DEBIT" && item.status === "PENDING")
    .reduce((total, item) => total + item.amount.toNumber(), 0);

  const hasTransactions = user.transactions.length > 0;
  const userCpf = user.pixKeyType === "CPF" ? user.pixKey : "";

  return (
    <div className="min-h-screen bg-[#020617] text-white font-poppins pb-24 pt-8">
      <div className="container mx-auto max-w-6xl px-4 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500 font-medium">
              MWC Health
            </p>
            <h1 className="text-3xl font-futura font-bold uppercase tracking-tight mt-2">
              Financeiro
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Acompanhe consultas pagas, saldo disponivel e solicitacoes de
              saque.
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0f172a] border border-white/10 rounded-xl text-slate-400 text-sm hover:text-white transition-colors">
            <Download className="w-4 h-4" />
            Exportar relatorio
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#d73cbe]/20 to-emerald-500/10 border border-[#d73cbe]/20 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[190px]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-32 h-32 text-[#d73cbe]" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Saldo disponivel para saque
              </p>
              <h2 className="text-4xl font-bold text-white font-futura mt-2">
                {formatCurrency(walletBalance)}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Valores ja liquidos, com taxa MWC de {PLATFORM_FEE_PERCENT}%
                aplicada.
              </p>
            </div>

            <div className="mt-6">
              <WithdrawButton balance={walletBalance} userCpf={userCpf} />
            </div>
          </div>

          <div className="bg-[#0f172a]/80 border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">
                Receita liquida Health
              </p>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Banknote className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(netHealthRevenue)}
                </span>
              </div>
            </div>

            <div className="h-px bg-white/10 w-full" />

            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Ultima chave Pix
                </p>
              </div>

              {user.pixKey ? (
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="p-2 bg-[#020617] rounded-lg text-white">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Pix CPF</p>
                    <p className="text-xs text-slate-400 truncate max-w-[170px]">
                      {user.pixKey}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 opacity-80">
                  <div className="p-2 bg-[#020617] rounded-lg text-slate-400">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-300">
                      Nenhum saque ainda
                    </p>
                    <p className="text-xs text-slate-500">
                      A chave sera salva no primeiro saque.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 p-5">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
              Bruto em consultas
            </p>
            <p className="text-2xl font-bold text-white mt-2">
              {formatCurrency(grossHealthRevenue)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 p-5">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Taxa MWC
            </p>
            <p className="text-2xl font-bold text-red-300 mt-2">
              - {formatCurrency(platformFeeTotal)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 p-5">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
              Creditado
            </p>
            <p className="text-2xl font-bold text-emerald-400 mt-2">
              {formatCurrency(completedCredits)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 p-5">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
              Saques pendentes
            </p>
            <p className="text-2xl font-bold text-yellow-400 mt-2">
              {formatCurrency(pendingWithdrawals)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white font-futura flex items-center gap-2">
            <History className="w-5 h-5 text-[#d73cbe]" />
            Historico de movimentacoes
          </h2>

          <div className="bg-[#0f172a]/80 border border-white/10 rounded-2xl overflow-hidden">
            {!hasTransactions ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <CalendarClock className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Nenhuma movimentacao ainda
                </h3>
                <p className="text-slate-400 max-w-sm mt-2">
                  Quando um paciente pagar uma consulta, o valor liquido entrara
                  automaticamente na sua carteira.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {user.transactions.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          item.type === "CREDIT"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-300"
                        }`}
                      >
                        {item.type === "CREDIT" ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <p className="font-bold text-white text-sm">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>
                            {new Date(item.createdAt).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                          <span>*</span>
                          {statusText(item.status)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 pl-14 md:pl-0">
                      <span
                        className={`font-bold font-futura ${
                          item.type === "CREDIT"
                            ? "text-emerald-400"
                            : "text-white"
                        }`}
                      >
                        {item.type === "CREDIT" ? "+" : "-"}{" "}
                        {formatCurrency(item.amount.toNumber())}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
