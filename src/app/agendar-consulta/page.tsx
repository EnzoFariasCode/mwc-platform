"use client";

import { useRef } from "react";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  Star,
  ShieldCheck,
  HeartPulse,
  Scale,
} from "lucide-react";
import FooterContact from "@/components/ui/FooterContact";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AgendarConsultaPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".gsap-care-image",
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-care-section",
            start: "top 75%",
          },
        },
      );

      gsap.fromTo(
        ".gsap-care-step",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".gsap-care-section",
            start: "top 70%",
          },
        },
      );
    },
    { scope: pageRef },
  );

  const specialties = [
    {
      id: "psicologia",
      name: "Psicologia",
      description:
        "Terapia online para ansiedade, depressao e autoconhecimento.",
      image:
        "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80",
      color:
        "group-hover:border-[#d73cbe]/50 group-hover:shadow-[0_0_30px_rgba(215,60,190,0.15)]",
      accentText: "text-[#d73cbe]",
      accentBg: "bg-[#d73cbe]",
      count: "15+ especialistas",
    },
    {
      id: "nutricao",
      name: "Nutricao",
      description: "Planos alimentares, emagrecimento e hipertrofia.",
      image:
        "https://images.pexels.com/photos/15391542/pexels-photo-15391542.jpeg?auto=compress&cs=tinysrgb&w=600",
      color:
        "group-hover:border-emerald-500/50 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
      accentText: "text-emerald-400",
      accentBg: "bg-emerald-500",
      count: "8+ especialistas",
    },
    {
      id: "personal",
      name: "Personal Trainer",
      description: "Treinos personalizados e acompanhamento de rotina fisica.",
      image:
        "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
      color:
        "group-hover:border-orange-500/50 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]",
      accentText: "text-orange-400",
      accentBg: "bg-orange-500",
      count: "12+ especialistas",
    },
    {
      id: "ingles",
      name: "Professor de Ingles",
      description: "Aulas focadas em conversacao, negocios e fluencia.",
      image:
        "https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=600&q=80",
      color:
        "group-hover:border-blue-500/50 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
      accentText: "text-blue-400",
      accentBg: "bg-blue-500",
      count: "20+ especialistas",
    },
    {
      id: "advogado",
      name: "Advogado",
      description: "Consultoria jurídica, revisão de contratos e mediação.",
      image:
        "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80",
      color:
        "group-hover:border-amber-500/50 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
      accentText: "text-amber-400",
      accentBg: "bg-amber-500",
      count: "10+ especialistas",
    },
  ];

  return (
    <div
      ref={pageRef}
      className="min-h-screen bg-[#020617] text-white font-poppins selection:bg-[#d73cbe]/30 flex flex-col relative"
    >
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#d73cbe]/5 rounded-full blur-[150px]" />
      </div>

      <main className="flex-grow relative z-10">
        <section className="container mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-col items-start text-left mb-16 max-w-3xl">
            <h1 className="font-futura text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
              Encontre o especialista ideal para o seu{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d73cbe] to-purple-400">
                bem-estar.
              </span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed">
              Agende consultas online ou presenciais com profissionais
              rigorosamente selecionados. Escolha a area de cuidado abaixo para
              comecar.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 items-stretch">
            {specialties.map((spec, index) => (
              <React.Fragment key={spec.id}>
                <Link
                  href={`/agendar-consulta/${spec.id}`}
                  className="block outline-none w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                >
                  <div
                    className={`group flex flex-col h-full bg-[#0f172a]/90 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 ${spec.color}`}
                  >
                    <div className="relative h-[200px] w-full overflow-hidden shrink-0 bg-slate-900">
                      <Image
                        src={spec.image}
                        alt={spec.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-90" />
                    </div>
                    <div className="flex flex-col flex-grow p-6">
                      <div>
                        <h2
                          className={`font-futura text-xl font-bold uppercase tracking-wide mb-2 transition-colors duration-300 ${spec.accentText}`}
                        >
                          {spec.name}
                        </h2>
                        <p className="text-sm text-slate-400 leading-relaxed font-light">
                          {spec.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 mt-auto border-t border-white/5">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex -space-x-2">
                            <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-[#0f172a]" />
                            <div className="w-7 h-7 rounded-full bg-slate-600 border-2 border-[#0f172a]" />
                            <div className="w-7 h-7 rounded-full bg-slate-500 border-2 border-[#0f172a] flex items-center justify-center">
                              <span className="text-[9px] font-bold">+</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                            {spec.count}
                          </span>
                        </div>
                        <div
                          className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 transition-all duration-300 group-hover:text-white ${spec.accentBg} group-hover:border-transparent`}
                        >
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Força a quebra de linha após o 3º card no Desktop para deixar 2 centralizados embaixo */}
                {index === 2 && <div className="hidden lg:block w-full h-0" />}
              </React.Fragment>
            ))}
          </div>
        </section>

        <section className="gsap-care-section border-t border-white/5 bg-[#0f172a]/30 mt-16 py-24 relative overflow-hidden">
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[400px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div className="gsap-care-image lg:sticky lg:top-32 relative h-[500px] lg:h-[600px] w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80"
                  alt="Mulher praticando autocuidado"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/90 via-[#020617]/20 to-transparent" />

                <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#d73cbe]/20 flex items-center justify-center text-[#d73cbe]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-futura font-bold text-lg leading-tight mb-1">
                      Confianca Total
                    </h4>
                    <p className="text-sm text-slate-300">
                      Seus dados e consultas protegidos com criptografia ponta a
                      ponta.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col pt-8 lg:pt-0">
                <h2 className="font-futura text-3xl md:text-4xl font-bold text-white mb-6 leading-tight uppercase tracking-wide">
                  Sua saude e o seu <br />
                  <span className="text-[#d73cbe]">maior projeto.</span>
                </h2>
                <p className="text-slate-400 text-lg mb-12 font-light leading-relaxed">
                  Nao adianta construir uma carreira de sucesso se a fundacao
                  nao estiver forte. A MWC Health traz uma abordagem 360 para a
                  sua evolucao.
                </p>

                <div className="relative border-l border-white/10 ml-3 space-y-12 pb-8">
                  <div className="gsap-care-step relative pl-10">
                    <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-[#020617] border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(215,60,190,0.2)]">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#d73cbe]" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <HeartPulse className="w-5 h-5 text-[#d73cbe]" />
                      <h3 className="text-xl font-bold text-white font-futura uppercase tracking-wide">
                        Mente Sana
                      </h3>
                    </div>
                    <p className="text-slate-400 leading-relaxed font-light">
                      O stress diario consome sua energia criativa. Nossos
                      psicologos te ajudam a desenvolver inteligencia emocional
                      e blindar sua mente contra a ansiedade e o burnout.
                    </p>
                  </div>

                  <div className="gsap-care-step relative pl-10">
                    <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-[#020617] border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-xl font-bold text-white font-futura uppercase tracking-wide">
                        Corpo Ativo
                      </h3>
                    </div>
                    <p className="text-slate-400 leading-relaxed font-light">
                      Nutricao e movimento andam juntos. Tenha planos
                      alimentares realistas e treinos que respeitam o seu tempo,
                      desenhados para maxima disposicao no seu dia a dia.
                    </p>
                  </div>

                  <div className="gsap-care-step relative pl-10">
                    <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-[#020617] border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <Star className="w-5 h-5 text-blue-500" />
                      <h3 className="text-xl font-bold text-white font-futura uppercase tracking-wide">
                        Evolucao Continua
                      </h3>
                    </div>
                    <p className="text-slate-400 leading-relaxed font-light">
                      Alem do corpo e da mente, aprimore suas habilidades com
                      professores de idiomas focados em conversacao, garantindo
                      que voce esteja pronto para qualquer oportunidade.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterContact />
    </div>
  );
}
