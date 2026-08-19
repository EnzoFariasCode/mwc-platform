"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  getHealthPaymentStatus,
  type HealthPaymentStatus,
} from "../actions/get-health-payment-status";

const POLL_INTERVAL_MS = 1_500;
const MAX_AUTOMATIC_POLLS = 40;

type Props = {
  sessionId?: string;
  initialStatus: HealthPaymentStatus;
};

export function HealthCheckoutStatusCard({
  sessionId,
  initialStatus,
}: Props) {
  const [paymentStatus, setPaymentStatus] = useState(initialStatus);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isConfirmed = paymentStatus.state === "CONFIRMED";
  const isProcessing = paymentStatus.state === "PROCESSING";
  const meetingPending =
    isConfirmed && paymentStatus.meetingState !== "READY";

  useEffect(() => {
    if (!sessionId || paymentStatus.state !== "PROCESSING") return;

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      attempts += 1;

      try {
        const nextStatus = await getHealthPaymentStatus(sessionId);
        if (cancelled) return;

        setPaymentStatus(nextStatus);
        if (
          nextStatus.state === "PROCESSING" &&
          attempts < MAX_AUTOMATIC_POLLS
        ) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled && attempts < MAX_AUTOMATIC_POLLS) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    };

    timer = setTimeout(poll, 700);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [paymentStatus.state, sessionId]);

  async function refreshStatus() {
    if (!sessionId || isRefreshing) return;

    setIsRefreshing(true);
    try {
      setPaymentStatus(await getHealthPaymentStatus(sessionId));
    } catch {
      // Mantem a mensagem atual enquanto a verificacao automatica continua.
    } finally {
      setIsRefreshing(false);
    }
  }

  const Icon = isConfirmed
    ? CheckCircle2
    : isProcessing
      ? Clock
      : AlertCircle;

  return (
    <div
      className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] p-8 text-center shadow-2xl md:p-10"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-full -translate-x-1/2 bg-blue-500/20 blur-[70px]" />

      <div
        className={`mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border shadow-[0_0_30px_rgba(59,130,246,0.2)] ${
          isConfirmed
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            : isProcessing
              ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
              : "border-amber-500/20 bg-amber-500/10 text-amber-300"
        }`}
      >
        <Icon className={`h-12 w-12 ${isProcessing ? "animate-pulse" : ""}`} />
      </div>

      <h1 className="mb-4 font-futura text-3xl font-bold uppercase tracking-tight text-white">
        {isConfirmed
          ? "Agendamento confirmado"
          : isProcessing
            ? "Confirmando pagamento"
            : "Não foi possível consultar"}
      </h1>

      <p className="mb-8 text-sm leading-relaxed text-slate-400">
        {isConfirmed
          ? "Seu pagamento foi aprovado e a consulta já está registrada para você e para o profissional."
          : isProcessing
            ? "O checkout foi concluído. Aguarde nesta página enquanto confirmamos automaticamente o agendamento."
            : paymentStatus.message}
      </p>

      {isProcessing && (
        <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-left text-xs text-blue-200">
          <div className="flex items-center gap-2 font-semibold text-blue-100">
            <Clock className="h-4 w-4" />
            Confirmação automática em andamento
          </div>
          <p className="mt-1 text-blue-200/80">{paymentStatus.message}</p>
        </div>
      )}

      {meetingPending && (
        <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-left text-xs text-blue-100">
          <p className="font-semibold">Sala online em preparação</p>
          <p className="mt-1 text-blue-100/80">{paymentStatus.message}</p>
        </div>
      )}

      {isConfirmed && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-left text-xs text-emerald-100">
          <p className="font-semibold">Pagamento protegido</p>
          <p className="mt-1 text-emerald-100/80">
            O valor fica retido e só é liberado ao profissional após a consulta.
            Cancelamentos do paciente com mais de 24 horas geram reembolso
            integral; ausência do paciente não gera reembolso.
          </p>
        </div>
      )}

      <div className="relative z-10 space-y-4">
        {isProcessing && sessionId && (
          <button
            type="button"
            onClick={refreshStatus}
            disabled={isRefreshing}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 py-4 font-bold text-blue-200 transition-all hover:bg-blue-500/15 active:scale-95 disabled:cursor-wait disabled:opacity-60"
          >
            Atualizar agora
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        )}

        <Link
          href="/agendar-consulta/historico"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#d73cbe] py-4 font-bold text-white shadow-lg shadow-[#d73cbe]/25 transition-all hover:bg-[#b02da0] active:scale-95"
        >
          Ver meus atendimentos <CalendarClock className="h-4 w-4" />
        </Link>

        <Link
          href="/agendar-consulta"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 py-4 font-bold text-slate-300 transition-all hover:bg-white/10 active:scale-95"
        >
          Fazer novo agendamento <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
