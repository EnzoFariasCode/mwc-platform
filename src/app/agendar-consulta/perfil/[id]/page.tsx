import { notFound } from "next/navigation";
import Image from "next/image";
import { Star, MapPin, Video, ShieldCheck } from "lucide-react";
import { getHealthProfessionalById } from "@/modules/health/services/professional-service";
import { ProfileViewClient } from "./profile-view-client";
import { MonthlyScheduleClient } from "./monthly-schedule-client";
import { BackButtonClient } from "./back-button-client"; // <-- Importamos o novo botão inteligente

export default async function ProfessionalHealthProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pro = await getHealthProfessionalById(id);

  if (!pro) {
    notFound();
  }

  const proName = pro.displayName || pro.name;

  return (
    <div className="min-h-screen bg-[#020617] text-white font-poppins pb-24 pt-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center mb-8">
          {/* NOSSO NOVO BOTÃO INTELIGENTE */}
          <BackButtonClient />

          <ProfileViewClient proId={id} proData={pro} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* COLUNA ESQUERDA: INFO DO PROFISSIONAL */}
          <div className="w-full lg:w-2/3 space-y-8">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#d73cbe]/5 rounded-full blur-[100px] pointer-events-none" />

              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shrink-0 border-2 border-white/10 shadow-2xl">
                <Image
                  src={`/api/images/user/${id}`}
                  alt={proName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="flex flex-col justify-center relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#d73cbe]/20 text-[#d73cbe] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#d73cbe]/20">
                    {pro.jobTitle || "Especialista MWC"}
                  </span>
                  {pro.documentReg && (
                    <span className="bg-white/5 text-slate-400 px-3 py-1 rounded-full text-[10px] font-medium border border-white/5">
                      {pro.documentReg}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-futura font-bold text-white mb-2 uppercase tracking-tight">
                  {proName}
                </h1>

                {pro.approach && (
                  <p className="text-slate-400 text-sm mb-4">
                    Abordagem:{" "}
                    <span className="text-white font-medium">
                      {pro.approach}
                    </span>
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-6 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold">
                      {(pro.rating || 5.0).toFixed(1)}
                    </span>
                    <span className="text-slate-500 text-sm">
                      ({pro.ratingCount || 0} avaliações)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    {pro.city || "Brasil"}, {pro.state || "BR"}
                  </div>
                </div>
              </div>
            </div>

            {/* SOBRE */}
            <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-8">
              <h2 className="text-xl font-futura font-bold text-white mb-4 uppercase tracking-wide">
                Sobre o especialista
              </h2>
              <p className="text-slate-400 leading-relaxed font-light whitespace-pre-wrap">
                {pro.bio ||
                  "Este profissional ainda não preencheu sua biografia detalhada."}
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
                    Atendimentos online por videochamada segura.
                  </p>
                </div>
              </div>
              <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 flex gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl h-fit">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">
                    Perfil Verificado
                  </h3>
                  <p className="text-sm text-slate-400">
                    Registro profissional validado pela MWC Health.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: CALENDÁRIO INTELIGENTE */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-28">
            <MonthlyScheduleClient
              pro={{
                ...pro,
                availability: (pro.availability ?? undefined) as any,
                sessionDuration: pro.sessionDuration ?? undefined,
                consultationFee: pro.consultationFee
                  ? pro.consultationFee.toNumber()
                  : undefined,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
