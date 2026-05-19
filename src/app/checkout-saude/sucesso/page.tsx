import Link from "next/link";
import { CheckCircle2, ArrowRight, CalendarClock, AlertTriangle } from "lucide-react";
import { confirmHealthPayment } from "@/modules/health/actions/confirm-health-payment";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const sessionId =
    typeof resolvedParams.session_id === "string"
      ? resolvedParams.session_id
      : undefined;

  const confirmation = sessionId
    ? await confirmHealthPayment(sessionId)
    : { success: false, error: "Session de pagamento nao encontrada." };

  const isConfirmed = confirmation.success;

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-poppins text-white">
      <div className="max-w-md w-full bg-[#0f172a] border border-white/10 rounded-3xl p-8 md:p-10 text-center shadow-2xl relative overflow-hidden">
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 blur-[70px] pointer-events-none ${
            isConfirmed ? "bg-emerald-500/20" : "bg-red-500/20"
          }`}
        />

        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border shadow-[0_0_30px_rgba(16,185,129,0.2)] ${
            isConfirmed
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          {isConfirmed ? (
            <CheckCircle2 className="w-12 h-12" />
          ) : (
            <AlertTriangle className="w-12 h-12" />
          )}
        </div>

        <h1 className="text-3xl font-futura font-bold text-white mb-4 uppercase tracking-tight">
          {isConfirmed ? "Consulta Confirmada!" : "Confirmacao Pendente"}
        </h1>

        <p className="text-slate-400 mb-8 leading-relaxed">
          {isConfirmed
            ? "Sua consulta foi salva com sucesso. O horario ja esta reservado na agenda do profissional."
            : confirmation.error ||
              "Nao foi possivel confirmar sua consulta automaticamente."}
        </p>

        <div className="space-y-4 relative z-10">
          <Link
            href="/agendar-consulta/historico"
            className="w-full py-4 bg-[#d73cbe] hover:bg-[#b02da0] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#d73cbe]/25"
          >
            Ver minhas consultas <CalendarClock className="w-4 h-4" />
          </Link>

          <Link
            href="/agendar-consulta"
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5"
          >
            Fazer novo agendamento <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
