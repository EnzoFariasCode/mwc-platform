"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Video, ChevronRight, ChevronLeft } from "lucide-react";

// Mock de dados - Isso virá do seu Back-end depois
const professionals = [
  {
    id: "pro_1",
    name: "Dr. Carlos Eduardo",
    title: "Psicólogo Clínico",
    crp: "CRP 06/12345",
    rating: 4.9,
    reviews: 128,
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=250&q=80",
    description:
      "Especialista em Terapia Cognitivo-Comportamental (TCC) para ansiedade e burnout.",
    price: "R$ 150",
    tags: ["Ansiedade", "Depressão", "Burnout"],
    // Mock da agenda do profissional
    schedule: [
      { date: "Hoje, 13 Abr", slots: ["14:00", "15:00", "18:30"] },
      { date: "Ter, 14 Abr", slots: ["09:00", "10:00", "14:00", "16:00"] },
      { date: "Qua, 15 Abr", slots: ["11:00", "17:00"] },
    ],
  },
];

export default function SpecialtyPage({
  params,
}: {
  params: { specialty: string };
}) {
  // Pega a especialidade da URL e formata
  const specialtyName =
    params.specialty.charAt(0).toUpperCase() + params.specialty.slice(1);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-poppins pt-24 pb-16">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-8 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-futura font-bold text-white mb-2">
            Especialistas em{" "}
            <span className="text-[#d73cbe]">{specialtyName}</span>
          </h1>
          <p className="text-slate-400">
            Encontre o profissional ideal e escolha o melhor horário para você.
          </p>
        </div>

        <div className="space-y-6">
          {professionals.map((pro) => (
            <div
              key={pro.id}
              className="bg-[#0f172a]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-8 transition-colors hover:border-white/20"
            >
              {/* ESQUERDA: Perfil do Profissional */}
              <div className="md:w-1/3 flex flex-col gap-4">
                <div className="flex gap-4 items-start">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <Image
                      src={pro.image}
                      alt={pro.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg leading-tight">
                      {pro.name}
                    </h2>
                    <p className="text-sm text-[#d73cbe] font-medium">
                      {pro.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{pro.crp}</p>

                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{pro.rating}</span>
                      <span className="text-xs text-slate-500">
                        ({pro.reviews} avaliações)
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                  {pro.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {pro.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-1 rounded-md text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Video className="w-4 h-4 text-emerald-500" />
                    Telemedicina
                  </div>
                  <span className="font-bold text-lg">{pro.price}</span>
                </div>
              </div>

              {/* DIREITA: Calendário e Horários (Baseado na sua imagem) */}
              <div className="md:w-2/3 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                    Próximos Horários
                  </h3>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grid de Dias e Slots */}
                <div className="grid grid-cols-3 gap-4 flex-grow">
                  {pro.schedule.map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div className="text-xs font-medium text-slate-400 mb-2">
                        {day.date}
                      </div>

                      {day.slots.map((time, timeIdx) => (
                        <Link
                          key={timeIdx}
                          href={`/checkout-saude?proId=${pro.id}&time=${time}&date=${day.date}`}
                          className="w-full py-2 text-sm font-medium text-center text-[#d73cbe] bg-[#d73cbe]/10 border border-[#d73cbe]/30 rounded-lg hover:bg-[#d73cbe] hover:text-white transition-all"
                        >
                          {time}
                        </Link>
                      ))}

                      {day.slots.length < 4 && (
                        <div className="w-full py-2 text-sm text-center text-slate-600 border border-dashed border-white/5 rounded-lg">
                          -
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <Link
                    href={`/perfil/${pro.id}`}
                    className="text-xs text-slate-400 hover:text-white transition-colors underline decoration-white/20 underline-offset-4"
                  >
                    Ver perfil completo
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
