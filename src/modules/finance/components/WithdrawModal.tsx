"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  X,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { requestWithdrawal } from "@/modules/finance/actions/request-withdrawal";

interface WithdrawButtonProps {
  balance: number;
  userCpf?: string | null; // Opcional: Se você já tiver o CPF do cadastro, pode pré-preencher
}

export function WithdrawButton({ balance, userCpf }: WithdrawButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Formata moeda
  const formattedBalance = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(balance);

  const handleOpen = () => {
    if (balance < 50) {
      toast.warning("O valor mínimo para saque é de R$ 50,00.");
      return;
    }
    setIsOpen(true);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await requestWithdrawal(formData);

    setIsLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success);
      setIsOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={balance < 50} // Desabilita visualmente se não tiver mínimo
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
      >
        <ArrowUpRight className="w-5 h-5" />
        SOLICITAR SAQUE
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
            {/* Header */}
            <div className="p-6 border-b border-border flex justify-between items-center bg-white/5">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-primary" />
                Realizar Saque
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Valor Total */}
              <div className="text-center space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Valor a ser recebido
                </span>
                <div className="text-4xl font-bold text-white font-futura">
                  {formattedBalance}
                </div>
                <p className="text-xs text-green-400 font-medium">
                  Taxa de saque: R$ 0,00 (Grátis)
                </p>
              </div>

              {/* Input CPF */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Lock className="w-3 h-3 text-primary" />
                  Chave Pix (CPF do Titular)
                </label>
                <input
                  name="cpfPix"
                  type="text"
                  defaultValue={userCpf || ""}
                  placeholder="000.000.000-00"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-lg font-bold focus:border-primary focus:outline-none placeholder:text-slate-700 text-center tracking-widest"
                />
                <p className="text-[10px] text-slate-500 text-center leading-tight">
                  Por segurança, enviamos apenas para o CPF cadastrado na conta.
                </p>
              </div>

              {/* Regras (Rodapé do Modal) */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-yellow-500">
                    Atenção aos prazos
                  </h4>
                  <p className="text-[11px] text-yellow-500/80 leading-relaxed">
                    • O valor cairá na sua conta em até{" "}
                    <strong>24 horas úteis</strong>.<br />• O saque é do{" "}
                    <strong>valor total</strong> disponível.
                    <br />• Certifique-se que o CPF digitado é válido.
                  </p>
                </div>
              </div>

              {/* Botões */}
              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    "Processando..."
                  ) : (
                    <>CONFIRMAR SAQUE DE {formattedBalance}</>
                  )}
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
