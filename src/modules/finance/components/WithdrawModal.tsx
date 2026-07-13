"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  X,
  AlertTriangle,
  Landmark,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { requestWithdrawal } from "@/modules/finance/actions/request-withdrawal";
import { calculateWithdrawalDueAt } from "@/modules/finance/lib/withdrawal-deadline";

interface WithdrawButtonProps {
  balance: number;
  userCpf?: string | null;
}

const MIN_WITHDRAWAL_AMOUNT = 0.01;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function WithdrawButton({ balance, userCpf }: WithdrawButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(balance.toFixed(2).replace(".", ","));
  const [pixKeyType, setPixKeyType] = useState(userCpf ? "CPF" : "EMAIL");
  const [pixKey, setPixKey] = useState(userCpf || "");
  const [deadlineAccepted, setDeadlineAccepted] = useState(false);
  const [estimatedDueAt, setEstimatedDueAt] = useState(() =>
    calculateWithdrawalDueAt(new Date()),
  );

  const formattedBalance = formatCurrency(balance);
  const parsedAmount = useMemo(() => {
    const normalized = amount.replace(/\./g, "").replace(",", ".");
    const value = Number(normalized);
    return Number.isFinite(value) ? value : 0;
  }, [amount]);

  const handleOpen = () => {
    if (balance < MIN_WITHDRAWAL_AMOUNT) {
      toast.warning("O valor minimo para saque e de R$ 0,01.");
      return;
    }

    setAmount(balance.toFixed(2).replace(".", ","));
    setPixKeyType(userCpf ? "CPF" : "EMAIL");
    setPixKey(userCpf || "");
    setDeadlineAccepted(false);
    setEstimatedDueAt(calculateWithdrawalDueAt(new Date()));
    setIsOpen(true);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (parsedAmount < MIN_WITHDRAWAL_AMOUNT) {
      toast.error("O saque minimo e de R$ 0,01.");
      return;
    }

    if (parsedAmount > balance) {
      toast.error("O valor solicitado excede o saldo disponivel.");
      return;
    }

    if (!deadlineAccepted) {
      toast.error("Confirme o prazo estimado antes de solicitar o saque.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await requestWithdrawal(formData);

    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Solicitacao de saque registrada", {
      description: result.data
        ? `${formatCurrency(result.data.amount)} para ${result.data.pixKeyType} - ${result.data.pixKey}. Pagamento estimado ate ${new Date(result.data.dueAt).toLocaleDateString("pt-BR")}.`
        : "Acompanhe o prazo no seu painel financeiro.",
    });
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={balance < MIN_WITHDRAWAL_AMOUNT}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
      >
        <ArrowUpRight className="w-5 h-5" />
        SOLICITAR SAQUE PIX
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
            <div className="p-6 border-b border-border flex justify-between items-center bg-white/5">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-primary" />
                Solicitar Saque Pix
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Fechar saque"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Saldo disponivel
                </span>
                <div className="text-4xl font-bold text-white font-futura">
                  {formattedBalance}
                </div>
                <p className="text-xs text-green-400 font-medium">
                  Saque minimo: R$ 0,01
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Landmark className="w-3 h-3 text-primary" />
                    Valor do saque
                  </label>
                  <input
                    name="amount"
                    type="text"
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value);
                      setDeadlineAccepted(false);
                    }}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-lg font-bold focus:border-primary focus:outline-none placeholder:text-slate-700 text-center"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-2 sm:col-span-1">
                    <label className="text-xs font-bold uppercase text-slate-500">
                      Tipo
                    </label>
                    <select
                      name="pixKeyType"
                      value={pixKeyType}
                      onChange={(event) => {
                        setPixKeyType(event.target.value);
                        setDeadlineAccepted(false);
                      }}
                      className="w-full cursor-pointer rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-primary"
                    >
                      <option value="CPF">CPF</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="EMAIL">E-mail</option>
                      <option value="PHONE">Telefone</option>
                      <option value="EVP">Aleatoria</option>
                    </select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-500">
                      Chave Pix
                    </label>
                    <input
                      name="pixKey"
                      type="text"
                      value={pixKey}
                      onChange={(event) => {
                        setPixKey(event.target.value);
                        setDeadlineAccepted(false);
                      }}
                      placeholder="Sua chave Pix"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm font-bold focus:border-primary focus:outline-none placeholder:text-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-yellow-500">
                    Processamento manual
                  </h4>
                  <p className="text-[11px] text-yellow-500/80 leading-relaxed">
                    O valor sera reservado imediatamente. O pagamento do cliente
                    foi processado por cartao na Stripe; este saque sera pago
                    manualmente na chave informada em ate 12 dias.
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-primary/25 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Resumo da solicitacao
                </div>
                <dl className="space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Valor liquido</dt>
                    <dd className="text-right font-bold text-foreground">
                      {formatCurrency(parsedAmount)}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Chave Pix</dt>
                    <dd className="max-w-[65%] break-all text-right font-bold text-foreground">
                      {pixKeyType} - {pixKey || "Nao informada"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground">Data estimada</dt>
                    <dd className="text-right font-bold text-yellow-400">
                      Ate {estimatedDueAt.toLocaleDateString("pt-BR")}
                    </dd>
                  </div>
                </dl>

                <label className="flex cursor-pointer items-start gap-3 border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-300">
                  <input
                    type="checkbox"
                    name="deadlineAccepted"
                    value="true"
                    checked={deadlineAccepted}
                    onChange={(event) =>
                      setDeadlineAccepted(event.target.checked)
                    }
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span>
                    Confirmo o valor, a chave Pix e estou ciente de que o
                    pagamento sera processado manualmente em ate 12 dias, com
                    data estimada ate {estimatedDueAt.toLocaleDateString("pt-BR")}.
                  </span>
                </label>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isLoading || !deadlineAccepted}
                  className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait transition-all active:scale-[0.98]"
                >
                  {isLoading
                    ? "Processando..."
                    : `CONFIRMAR SAQUE DE ${formatCurrency(parsedAmount)}`}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-muted-foreground hover:text-white py-2"
                >
                  Cancelar e voltar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
