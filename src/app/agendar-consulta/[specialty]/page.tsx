"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Video,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

// 1. Mock de Dados (Simulando o Banco)
const mockDatabase: Record<string, any[]> = {
  psicologia: [
    {
      id: "pro_1",
      name: "Dr. Carlos Eduardo",
      title: "Psicólogo Clínico",
      document: "CRP 06/12345",
      rating: 4.9,
      reviews: 128,
      image:
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=250&q=80",
      description:
        "Especialista em Terapia Cognitivo-Comportamental (TCC) focada em ansiedade, depressão e síndrome de burnout no ambiente corporativo.",
      price: "R$ 150",
      tags: ["Ansiedade", "Depressão", "Burnout"],
      schedule: [
        { date: "Hoje, 13 Abr", slots: ["14:00", "15:00", "18:30"] },
        { date: "Ter, 14 Abr", slots: ["09:00", "10:00", "14:00", "16:00"] },
        { date: "Qua, 15 Abr", slots: ["11:00", "17:00"] },
      ],
    },
  ],
  advogado: [
    {
      id: "pro_2",
      name: "Dra. Mariana Rios",
      title: "Advogada Empresarial",
      document: "OAB/SP 123.456",
      rating: 5.0,
      reviews: 84,
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80",
      description:
        "Consultoria jurídica para freelancers e agências. Especialista em contratos de prestação de serviços (SLA), NDAs e proteção de propriedade intelectual.",
      price: "R$ 250",
      tags: ["Contratos TI", "Trabalhista", "Societário"],
      schedule: [
        { date: "Hoje, 13 Abr", slots: ["16:00", "17:30"] },
        { date: "Ter, 14 Abr", slots: ["08:00", "09:00", "11:00"] },
        { date: "Qua, 15 Abr", slots: ["14:00", "15:00", "16:00", "17:00"] },
      ],
    },
  ],
};

// Se não achar a especialidade, usa o psicólogo de fallback provisório
const getProfessionals = (specialty: string) => {
  return mockDatabase[specialty] || mockDatabase["psicologia"];
};

export default function SpecialtyPage({
  params,
}: {
  params: Promise<{ specialty: string }>;
}) {
  const resolvedParams = use(params);
  const specialty = resolvedParams.specialty;

  const professionals = getProfessionals(specialty);
  const specialtyName = specialty.charAt(0).toUpperCase() + specialty.slice(1);

  // ESTADO SÊNIOR: Guarda qual horário o usuário selecionou
  const [selectedSlot, setSelectedSlot] = useState<{
    proId: string;
    time: string;
    date: string;
  } | null>(null);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-poppins pb-24 pt-8">
      <div className="container mx-auto max-w-5xl px-4">
        {/* HEADER DA PÁGINA */}
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
            Escolha o profissional ideal e o melhor horário para você. Sua
            reserva é confirmada instantaneamente.
          </p>
        </div>

        {/* LISTA DE PROFISSIONAIS */}
        <div className="space-y-8">
          {professionals.map((pro) => {
            // Verifica se este profissional tem um horário selecionado no momento
            const isThisProSelected = selectedSlot?.proId === pro.id;

            return (
              <div
                key={pro.id}
                className="bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-[32px] p-6 lg:p-8 flex flex-col lg:flex-row gap-8 transition-all hover:border-white/20 hover:shadow-2xl hover:shadow-black/50 relative overflow-hidden"
              >
                {/* Brilho de fundo sutil */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#d73cbe]/5 rounded-full blur-[80px] pointer-events-none" />

                {/* COLUNA ESQUERDA: Perfil do Profissional */}
                <div className="lg:w-[45%] flex flex-col gap-5 z-10">
                  <div className="flex gap-5 items-start">
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-lg">
                      <Image
                        src={pro.image}
                        alt={pro.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-bold text-xl leading-tight text-white">
                          {pro.name}
                        </h2>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-sm text-[#d73cbe] font-medium uppercase tracking-wide mb-1">
                        {pro.title}
                      </p>
                      <p className="text-xs text-slate-500 mb-3">
                        {pro.document}
                      </p>

                      <div className="flex items-center gap-1.5 bg-white/5 inline-flex px-2 py-1 rounded-lg border border-white/5">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-white">
                          {pro.rating}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          ({pro.reviews})
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed font-light mt-2">
                    {pro.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    {pro.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[11px] uppercase tracking-wider bg-[#d73cbe]/10 border border-[#d73cbe]/20 px-3 py-1.5 rounded-lg text-[#d73cbe] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* LINK VER PERFIL MOVIDO PARA A ESQUERDA */}
                  <div className="mt-2 pt-4 border-t border-white/5">
                    <Link
                      href={`/agendar-consulta/perfil/${pro.id}`}
                      className="text-xs font-medium text-slate-400 hover:text-white transition-colors underline decoration-white/20 underline-offset-4"
                    >
                      Ver perfil completo
                    </Link>
                  </div>
                </div>

                {/* COLUNA DIREITA: Agenda */}
                <div className="lg:w-[55%] border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8 flex flex-col z-10">
                  {/* Header da Agenda e Preço */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-slate-400" />
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                        Próximos Horários
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">
                        Valor da sessão
                      </span>
                      <span className="font-futura font-bold text-2xl text-white">
                        {pro.price}
                      </span>
                    </div>
                  </div>

                  {/* Grid de Dias (Carrossel Horizontal) */}
                  <div className="flex items-center gap-2 mb-4">
                    <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex-grow grid grid-cols-3 gap-3">
                      {pro.schedule.map((day: any, idx: number) => (
                        <div
                          key={idx}
                          className="text-center pb-2 border-b-2 border-transparent hover:border-white/10 transition-colors"
                        >
                          <span className="text-xs font-bold text-slate-300 block mb-1">
                            {day.date.split(",")[0]}
                          </span>
                          <span className="text-xs text-slate-500">
                            {day.date.split(",")[1]}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Slots de Tempo (Agora são botões selecionáveis) */}
                  <div className="grid grid-cols-3 gap-3 flex-grow">
                    {pro.schedule.map((day: any, idx: number) => (
                      <div key={idx} className="flex flex-col gap-2">
                        {day.slots.map((time: string, timeIdx: number) => {
                          const isSelected =
                            selectedSlot?.proId === pro.id &&
                            selectedSlot?.date === day.date &&
                            selectedSlot?.time === time;

                          return (
                            <button
                              key={timeIdx}
                              onClick={() =>
                                setSelectedSlot({
                                  proId: pro.id,
                                  time,
                                  date: day.date,
                                })
                              }
                              className={`w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-all group ${
                                isSelected
                                  ? "bg-[#d73cbe] text-white border-[#d73cbe] shadow-lg shadow-[#d73cbe]/20"
                                  : "text-slate-300 bg-[#020617] border border-white/10 hover:bg-[#d73cbe]/10 hover:text-white hover:border-[#d73cbe]/50"
                              }`}
                            >
                              <Clock
                                className={`w-3.5 h-3.5 ${isSelected ? "opacity-100" : "opacity-50 group-hover:opacity-100"}`}
                              />
                              {time}
                            </button>
                          );
                        })}
                        {day.slots.length < 4 && (
                          <div className="w-full py-2.5 flex items-center justify-center text-sm text-slate-600 border border-dashed border-white/5 rounded-xl bg-white/[0.02]">
                            -
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Rodapé da Agenda com o Botão PROSSEGUIR */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      <Video className="w-4 h-4" /> Telemedicina
                    </div>

                    {/* Botão Prosseguir Inteligente */}
                    {isThisProSelected ? (
                      <Link
                        // Adicionamos a interrogação (?) após o selectedSlot
                        href={`/checkout-saude?proId=${pro.id}&time=${selectedSlot?.time}&date=${selectedSlot?.date}`}
                        className="px-6 py-2.5 bg-[#d73cbe] text-white text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-[#b02da0] transition-all shadow-lg shadow-[#d73cbe]/20 animate-in fade-in"
                      >
                        Prosseguir <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <div className="px-6 py-2.5 bg-white/5 text-slate-500 text-sm font-bold rounded-xl flex items-center gap-2 cursor-not-allowed border border-white/5">
                        Prosseguir <ArrowRight className="w-4 h-4 opacity-50" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
