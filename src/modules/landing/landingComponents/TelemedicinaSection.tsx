"use client";

import { useRef } from "react";
import Image from "next/image"; // Import do Next Image
import Link from "next/link";
import { Check, ArrowRight, Brain, Apple, ShieldCheck } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// --- IMPORT LOCAL DA IMAGEM ---
import medicoImg from "@/assets/images/landingPage/medico.jpg";

gsap.registerPlugin(ScrollTrigger);

export default function TelemedicinaSection() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // 1. Lado Esquerdo (Texto)
      gsap.fromTo(
        ".gsap-left-col",
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          },
        }
      );

      // 2. Lista de Benefícios
      gsap.fromTo(
        ".gsap-list-item",
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          delay: 0.3,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          },
        }
      );

      // 3. Lado Direito (Cards + Imagem)
      gsap.fromTo(
        ".gsap-card-visual",
        { x: 50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative bg-slate-950 py-24 px-6 border-b border-white/5 overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] -z-10" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
        {/* LEFT – Editorial content */}
        <div className="gsap-left-col opacity-0">
          <h2 className="max-w-xl text-4xl md:text-5xl font-bold leading-tight text-white font-futura uppercase">
            Atendimento psicológico e nutricional,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#d73cbe] to-purple-500">
              sem sair de casa.
            </span>
          </h2>

          <p className="mt-6 max-w-lg text-lg text-slate-400 leading-relaxed">
            Conectamos você a profissionais de saúde qualificados para consultas
            online seguras, humanas e eficientes. Cuide de você no seu tempo.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              "Psicólogos e nutricionistas certificados",
              "Agendamento rápido e online",
              "Consultas por vídeo com total privacidade",
              "Acompanhamento contínuo",
            ].map((item, index) => (
              <li
                key={index}
                className="gsap-list-item opacity-0 flex items-start gap-3 text-slate-300"
              >
                <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#d73cbe]/20 text-[#d73cbe]">
                  <Check className="h-4 w-4" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link href="/agendar-consulta">
              <button className="group cursor-pointer bg-[#d73cbe] hover:bg-[#b0269a] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:-translate-y-1 flex items-center gap-2">
                Realizar consulta
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <span className="text-sm text-slate-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Atendimento
              100% online
            </span>
          </div>
        </div>

        {/* RIGHT – Visual cards */}
        <div className="relative grid gap-6 sm:grid-cols-2">
          {/* Card Psicologia */}
          <div className="gsap-card-visual opacity-0 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm hover:border-[#d73cbe]/30 transition-colors group">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-[#d73cbe] uppercase tracking-wide">
              Psicologia
            </span>
            <h3 className="mt-2 text-xl font-bold text-white font-futura">
              Saúde emocional
            </h3>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Cuidado psicológico com escuta ativa, empatia e profissionalismo.
              Terapia TCC, Psicanálise e mais.
            </p>
          </div>

          {/* Card Nutrição */}
          <div className="gsap-card-visual opacity-0 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm hover:border-emerald-500/30 transition-colors group sm:translate-y-8 mb-5">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
              <Apple className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-emerald-500 uppercase tracking-wide">
              Nutrição
            </span>
            <h3 className="mt-2 text-xl font-bold text-white font-futura">
              Alimentação consciente
            </h3>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Orientação nutricional personalizada para sua rotina,
              emagrecimento e hipertrofia.
            </p>
          </div>

          {/* IMAGEM DO MÉDICO (No lugar do div vazio) */}
          <div className="gsap-card-visual opacity-0 col-span-full mt-8 sm:mt-0 relative h-48 sm:h-56 rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
            <Image
              src={medicoImg}
              alt="Médico atendendo online"
              fill
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              placeholder="blur"
            />

            {/* Overlay para texto ficar legível */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

            {/* Conteúdo sobre a imagem */}
            <div className="absolute bottom-0 left-0 p-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white font-bold text-lg font-futura leading-none mb-1">
                  Profissionais Verificados
                </p>
                <p className="text-slate-300 text-xs">
                  Equipe multidisciplinar de alta qualidade
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
