import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  MapPin,
  Video,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { getHealthProfessionalById } from "@/modules/health/services/professional-service";

export default async function ProfessionalHealthProfile({
  params,
}: {
  params: { id: string };
}) {
  const pro = await getHealthProfessionalById(params.id);

  if (!pro) {
    notFound();
  }

  const proName = pro.displayName || pro.name;
  const price = pro.consultationFee
    ? Number(pro.consultationFee).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : "A combinar";

  const scheduleMock = [
    { date: "Hoje, 26 Abr", slots: ["14:00", "15:00", "18:30"] },
    { date: "Seg, 27 Abr", slots: ["09:00", "10:00", "14:00", "16:00"] },
    { date: "Ter, 28 Abr", slots: ["11:00", "17:00"] },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white font-poppins pt-24 pb-24">
      <div className="container mx-auto max-w-6xl px-4">
        <Link
          href="/agendar-consulta"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a pesquisa
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-2/3 space-y-8">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row gap-8">
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shrink-0 border-2 border-white/10 shadow-xl shadow-[#d73cbe]/10">
                <Image
                  src={
                    pro.image ||
                    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80"
                  }
                  alt={proName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#d73cbe]/20 text-[#d73cbe] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {pro.jobTitle || "Especialista em Saúde"}
                  </span>
                  {pro.documentReg && (
                    <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-medium border border-white/5">
                      {pro.documentReg}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-futura font-bold text-white mb-2">
                  {proName}
                </h1>

                {pro.approach && (
                  <p className="text-slate-400 text-sm mb-4">
                    Abordagem: <span className="text-white">{pro.approach}</span>
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-6 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold">{pro.rating.toFixed(1)}</span>
                    <span className="text-slate-500 text-sm">
                      ({pro.ratingCount} avaliações)
                    </span>
                  </div>
                  {pro.city && pro.state && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                      <MapPin className="w-4 h-4" />
                      {pro.city}, {pro.state}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a]/50 border border-white/5 rounded-3xl p-8">
              <h2 className="text-xl font-futura font-bold text-white mb-4">
                Sobre o especialista
              </h2>
              <p className="text-slate-400 leading-relaxed font-light whitespace-pre-wrap">
                {pro.bio ||
                  "Este profissional ainda não preencheu a biografia. Mas não se preocupe, todos os nossos especialistas passam por um rigoroso processo de verificação."}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 flex gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl h-fit">
                  <Video className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Telemedicina</h3>
                  <p className="text-sm text-slate-400">
                    Atendimentos online por videochamada através da nossa
                    plataforma segura.
                  </p>
                </div>
              </div>
              <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 flex gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl h-fit">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Perfil Verificado</h3>
                  <p className="text-sm text-slate-400">
                    Identidade e registos profissionais verificados pela equipa
                    MWC Health.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/3 lg:sticky lg:top-28">
            <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="font-futura font-bold text-xl text-white mb-6">
                Agendar Consulta
              </h3>

              <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-5 h-5 text-[#d73cbe]" />
                  <span>50 minutos</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Valor da Sessão
                  </p>
                  <p className="text-2xl font-bold text-[#d73cbe]">{price}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <button className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-white">
                  Próximos dias
                </span>
                <button className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-8">
                {scheduleMock.map((day, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className="text-center text-xs font-medium text-slate-400 mb-1">
                      {day.date}
                    </div>
                    {day.slots.map((time, timeIdx) => (
                      <Link
                        key={timeIdx}
                        href={`/checkout-saude?proId=${pro.id}&time=${time}&date=${encodeURIComponent(day.date)}`}
                        className="w-full py-2.5 text-sm font-medium text-center text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-[#d73cbe] hover:text-white hover:border-[#d73cbe] transition-all"
                      >
                        {time}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>

              <p className="text-xs text-center text-slate-500">
                O pagamento só é processado após a confirmação do profissional.
                Cancelamento gratuito até 24h antes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
