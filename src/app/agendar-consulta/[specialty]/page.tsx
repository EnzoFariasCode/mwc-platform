"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Video, ShieldCheck, ArrowLeft } from "lucide-react";

import { getProfessionalsBySpecialty } from "@/modules/users/actions/get-professionals";
import { MonthlyScheduleClient } from "@/app/agendar-consulta/perfil/[id]/monthly-schedule-client";

// ─── Tipagem Corrigida (Visão do Arquiteto Back-end) ──────────────────────────
interface Professional {
  id: string;
  name: string;
  displayName: string | null;
  jobTitle: string | null;
  documentReg: string | null;
  bio: string | null;
  hasProfileImage: boolean; // ← substituiu image: string | null
  rating: number;
  ratingCount: number;
  approach: string | null;
  industry: string | null;
  availability: any;
  sessionDuration: number | null;
  consultationFee: number | string | null;
  city?: string | null;
  state?: string | null;
}

export default function SpecialtyPage({
  params,
}: {
  params: Promise<{ specialty: string }>;
}) {
  const resolvedParams = use(params);
  const specialty = resolvedParams.specialty;
  const specialtyName = specialty.charAt(0).toUpperCase() + specialty.slice(1);

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfessionals() {
      setLoading(true);
      setError(null);
      try {
        const result = await getProfessionalsBySpecialty(specialty);
        if (result.error) {
          setError(result.error);
        } else {
          setProfessionals((result.data || []) as Professional[]);
        }
      } catch {
        setError("Falha ao carregar especialistas.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfessionals();
  }, [specialty]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white font-poppins pb-24 pt-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d73cbe] mx-auto mb-4" />
          <p className="text-slate-400">Carregando especialistas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] text-white font-poppins pb-24 pt-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link
            href="/agendar-consulta"
            className="text-[#d73cbe] hover:text-white"
          >
            Voltar para especialidades
          </Link>
        </div>
      </div>
    );
  }

  if (professionals.length === 0) {
    return (
      <div className="min-h-screen bg-[#020617] text-white font-poppins pb-24 pt-8">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-10">
            <Link
              href="/agendar-consulta"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para especialidades
            </Link>
            <h1 className="text-4xl md:text-5xl font-futura font-bold text-white mb-4 uppercase tracking-tighter">
              Especialistas em{" "}
              <span className="text-[#d73cbe]">{specialtyName}</span>
            </h1>
            <p className="text-slate-400 text-lg font-light max-w-2xl">
              Ainda não temos especialistas nesta área. Em breve teremos os
              melhores profissionais para você!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-poppins pb-24 pt-8">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-10">
          <Link
            href="/agendar-consulta"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para especialidades
          </Link>
          <h1 className="text-4xl md:text-5xl font-futura font-bold text-white mb-4 uppercase tracking-tighter">
            Especialistas em{" "}
            <span className="text-[#d73cbe]">{specialtyName}</span>
          </h1>
        </div>

        <div className="space-y-8">
          {professionals.map((pro) => (
            <div
              key={pro.id}
              className="bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-[32px] p-6 lg:p-8 flex flex-col lg:flex-row gap-8 transition-all hover:border-white/20 hover:shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#d73cbe]/5 rounded-full blur-[80px] pointer-events-none" />

              {/* COLUNA ESQUERDA: Perfil */}
              <div className="lg:w-[45%] flex flex-col gap-5 z-10">
                <div className="flex gap-5 items-start">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-lg">
                    <Image
                      src={
                        pro.hasProfileImage // ← era pro.image
                          ? `/api/images/user/${pro.id}`
                          : "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=250&q=80"
                      }
                      alt={pro.displayName ?? pro.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-bold text-xl leading-tight text-white">
                        {pro.displayName ?? pro.name}
                      </h2>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-sm text-[#d73cbe] font-medium uppercase tracking-wide mb-1">
                      {pro.jobTitle}
                    </p>
                    <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-bold text-white">
                        {(pro.rating ?? 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-light mt-2 line-clamp-3">
                  {pro.bio ?? "Sem biografia disponível."}
                </p>
                <div className="mt-2 pt-4 border-t border-white/5">
                  <Link
                    href={`/agendar-consulta/perfil/${pro.id}`}
                    className="text-xs font-medium text-slate-400 hover:text-white transition-colors underline underline-offset-4"
                  >
                    Ver perfil completo
                  </Link>
                </div>
              </div>

              {/* COLUNA DIREITA: Calendário (Sanitização aplicada aqui!) */}
              <div className="lg:w-[55%] border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8 flex flex-col z-10">
                <MonthlyScheduleClient
                  pro={{
                    ...pro,
                    availability: pro.availability ?? undefined,
                    consultationFee: pro.consultationFee ?? 0,
                    sessionDuration: pro.sessionDuration ?? 0,
                  }}
                />
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 mt-4 w-fit">
                  <Video className="w-4 h-4" /> Telemedicina
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
