"use client";

import { useRef } from "react";
import Image from "next/image";
import { BadgeCheck, Star, MessageCircle } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Registrar plugin
gsap.registerPlugin(ScrollTrigger);

const data = [
  {
    id: 1,
    title: "Web Development",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    name: "Enzo Indio",
    jobs: 289,
    rating: 4.9,
    verified: true,
  },
  {
    id: 2,
    title: "Video Maker",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    name: "Lara Silva",
    jobs: 150,
    rating: 5.0,
    verified: true,
  },
  {
    id: 3,
    title: "Eletricista",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
    name: "Tony Ramos",
    jobs: 320,
    rating: 4.8,
    verified: true,
  },
];

function Outstanding() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // 1. Título e Texto (Entram juntos suavemente)
      gsap.fromTo(
        ".gsap-header",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.2, // Pequeno atraso entre título e texto
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-header",
            start: "top 85%",
          },
        },
      );

      // 2. Cards dos Profissionais (Efeito Cascata / Stagger)
      gsap.fromTo(
        ".gsap-card",
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2, // Um card espera 0.2s depois do outro
          ease: "power3.out", // Movimento suave de desaceleração
          scrollTrigger: {
            trigger: ".gsap-grid-container", // Gatilho no container dos cards
            start: "top 75%",
          },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <section
      id="profissionais"
      ref={containerRef}
      className="relative py-24 px-4 bg-slate-950 border-b border-white/5 overflow-hidden"
    >
      {/* Container Principal */}
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Cabeçalho da Seção */}
        <h2 className="gsap-header opacity-0 text-3xl md:text-5xl font-bold tracking-tight text-[#d73cbe] drop-shadow-lg mb-6 text-center font-futura uppercase">
          Profissionais em Destaque
        </h2>

        <p className="gsap-header opacity-0 text-slate-400 text-center max-w-3xl mb-16 text-lg leading-relaxed">
          Todos os nossos profissionais possuem verificação de dados e
          comprovação de capacitação. Segurança total para você fechar negócio.
        </p>

        {/* Grid de Cards */}
        <div className="gsap-grid-container flex flex-wrap justify-center gap-8 w-full">
          {data.map((item) => (
            <div
              key={item.id}
              className="gsap-card opacity-0 group relative w-full max-w-[300px] bg-[#1a1b26] rounded-[20px] p-6 flex flex-col items-center border border-white/5 hover:border-[#d73cbe]/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_-10px_rgba(215,60,190,0.3)]"
            >
              {/* Categoria (Badge no topo) */}
              <span className="text-[#d73cbe] font-bold font-sans text-sm mb-6 tracking-wide uppercase">
                {item.title}
              </span>

              {/* Imagem de Perfil com Borda */}
              <div className="relative mb-4">
                <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#d73cbe] to-purple-600">
                  <Image
                    src={item.img}
                    alt={item.name}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover rounded-full border-4 border-[#1a1b26]"
                  />
                </div>
                {/* Selo de Verificado Flutuante */}
                {item.verified && (
                  <div
                    className="absolute bottom-1 right-1 bg-white text-blue-500 rounded-full p-0.5 shadow-lg"
                    title="Verificado"
                  >
                    <BadgeCheck className="w-6 h-6 fill-blue-100" />
                  </div>
                )}
              </div>

              {/* Nome e Info */}
              <h3 className="text-white font-bold text-xl mb-1">{item.name}</h3>

              <div className="flex items-center gap-1 mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(item.rating)
                          ? "fill-current"
                          : "text-slate-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-slate-400 text-xs ml-2">
                  ({item.jobs} trabalhos)
                </span>
              </div>

              {/* Botão de Contato */}
              <button className="w-full mt-auto cursor-pointer bg-[#2c1b4e] hover:bg-[#d73cbe] text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg">
                <MessageCircle className="w-4 h-4" />
                Entrar em contato
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Outstanding;
