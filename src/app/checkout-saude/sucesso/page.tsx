import Link from "next/link";
import { CheckCircle2, ArrowRight, CalendarClock, Clock } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-poppins text-white">
      {/* Aplicado o novo padrão de bordas: rounded-2xl (elegante e corporativo) */}
      <div className="max-w-md w-full bg-[#0f172a] border border-white/10 rounded-2xl p-8 md:p-10 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 blur-[70px] pointer-events-none bg-blue-500/20" />

        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
          <Clock className="w-12 h-12" />
        </div>

        <h1 className="text-3xl font-futura font-bold text-white mb-4 uppercase tracking-tight">
          Pagamento Recebido
        </h1>

        <p className="text-slate-400 mb-8 leading-relaxed text-sm">
          Seu pagamento foi recebido com segurança pelo Stripe. A reserva será concluída automaticamente pelo sistema e aparecerá no histórico em alguns instantes.
        </p>

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
