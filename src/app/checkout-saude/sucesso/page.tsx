import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { confirmHealthPayment } from "@/modules/health/actions/confirm-health-payment";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{ session_id?: string | string[] }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const sessionId = Array.isArray(params.session_id)
    ? params.session_id[0]
    : params.session_id;

  const confirmation = sessionId
    ? await confirmHealthPayment(sessionId)
    : {
        success: false,
        error: "Nao foi possivel localizar a sessao do pagamento.",
      };
  const Icon = confirmation.success ? CheckCircle2 : AlertCircle;

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-poppins text-white">
      {/* Aplicado o novo padrão de bordas: rounded-2xl (elegante e corporativo) */}
      <div className="max-w-md w-full bg-[#0f172a] border border-white/10 rounded-2xl p-8 md:p-10 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 blur-[70px] pointer-events-none bg-blue-500/20" />

        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border shadow-[0_0_30px_rgba(59,130,246,0.2)] ${
            confirmation.success
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
          }`}
        >
          <Icon className="w-12 h-12" />
        </div>

        <h1 className="text-3xl font-futura font-bold text-white mb-4 uppercase tracking-tight">
          {confirmation.success ? "Consulta Agendada" : "Pagamento Recebido"}
        </h1>

        <p className="text-slate-400 mb-8 leading-relaxed text-sm">
          {confirmation.success
            ? "Seu pagamento foi confirmado e a consulta ja esta disponivel no seu historico e na agenda do profissional."
            : "Seu pagamento foi recebido com seguranca pelo Stripe. A reserva sera concluida automaticamente pelo sistema e aparecera no historico em alguns instantes."}
        </p>

        {!confirmation.success && confirmation.error && (
          <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-left text-xs text-blue-200">
            <div className="flex items-center gap-2 font-semibold text-blue-100">
              <Clock className="h-4 w-4" />
              Confirmacao em processamento
            </div>
            <p className="mt-1 text-blue-200/80">{confirmation.error}</p>
          </div>
        )}

        <div className="space-y-4 relative z-10">
          <Link
            href="/agendar-consulta/historico"
            className="w-full py-4 bg-[#d73cbe] hover:bg-[#b02da0] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#d73cbe]/25 cursor-pointer active:scale-95"
          >
            Ver minhas consultas <CalendarClock className="w-4 h-4" />
          </Link>

          <Link
            href="/agendar-consulta"
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5 cursor-pointer active:scale-95"
          >
            Fazer novo agendamento <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
