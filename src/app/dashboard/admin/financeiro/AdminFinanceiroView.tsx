"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleDollarSign, Landmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approveWithdrawal } from "@/modules/admin/actions/approve-withdrawal";

export type AdminWithdrawalItem = {
  id: string;
  amount: number;
  pixKey: string;
  pixKeyType: string;
  status: string;
  createdAt: string;
  transactionId: string;
  user: {
    id: string;
    name: string;
    email: string;
    walletBalance: number;
  };
};

function formatMoney(amount: number) {
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AdminFinanceiroView({
  withdrawals,
}: {
  withdrawals: AdminWithdrawalItem[];
}) {
  const router = useRouter();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function handleApprove(withdrawalId: string) {
    setApprovingId(withdrawalId);
    const result = await approveWithdrawal(withdrawalId);

    if (result.success) {
      toast.success("Saque marcado como transferido.");
      router.refresh();
    } else {
      toast.error(result.error || "Nao foi possivel aprovar o saque.");
    }

    setApprovingId(null);
  }

  const totalAmount = withdrawals.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-300">
            <Landmark className="h-3.5 w-3.5" />
            Tesouraria
          </div>
          <h1 className="text-2xl font-bold text-white font-futura">
            Aprovação de Saques PIX
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Confira as solicitações pendentes e marque como transferidas após o
            pagamento manual via PIX.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric label="Pendentes" value={withdrawals.length.toString()} />
          <Metric label="Total" value={formatMoney(totalAmount)} />
        </div>
      </div>

      {withdrawals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-12 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">
            Nenhum saque pendente
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Novas solicitações PIX aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900 shadow-lg shadow-black/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-white/5 bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Data</th>
                  <th className="px-5 py-4">Profissional</th>
                  <th className="px-5 py-4">Valor</th>
                  <th className="px-5 py-4">Chave PIX</th>
                  <th className="px-5 py-4">Tipo</th>
                  <th className="px-5 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {withdrawals.map((withdrawal) => (
                  <tr
                    key={withdrawal.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4 text-slate-300">
                      {formatDate(withdrawal.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-white">
                        {withdrawal.user.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {withdrawal.user.email}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 font-bold text-emerald-300">
                        <CircleDollarSign className="h-4 w-4" />
                        {formatMoney(withdrawal.amount)}
                      </div>
                    </td>
                    <td className="max-w-[260px] px-5 py-4">
                      <p className="truncate font-mono text-slate-200">
                        {withdrawal.pixKey}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-white/10 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300">
                        {withdrawal.pixKeyType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleApprove(withdrawal.id)}
                        disabled={approvingId === withdrawal.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-black transition-colors hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
                      >
                        {approvingId === withdrawal.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Marcar como Transferido
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-900 px-4 py-3 text-right">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}
