import Link from "next/link";
import { CheckCircle2, ArrowRight, Home } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-poppins text-white">
      <div className="max-w-md w-full bg-[#0f172a] border border-white/10 rounded-3xl p-8 md:p-10 text-center shadow-2xl relative overflow-hidden">
        {/* Brilho de fundo verde (Sucesso) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-emerald-500/20 blur-[70px] pointer-events-none" />

        <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <h1 className="text-3xl font-futura font-bold text-white mb-4 uppercase tracking-tight">
          Pagamento Aprovado!
        </h1>

        <p className="text-slate-400 mb-8 leading-relaxed">
          Sua consulta foi confirmada e salva com sucesso. O profissional já foi
          notificado e o horário está reservado para você.
        </p>

        <div className="space-y-4 relative z-10">
          <Link
            href="/agendar-consulta"
            className="w-full py-4 bg-[#d73cbe] hover:bg-[#b02da0] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#d73cbe]/25"
          >
            Fazer novo agendamento <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5"
          >
            <Home className="w-4 h-4" /> Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
