"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Fluxo() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // 1. Título (Sobe padrão)
      gsap.fromTo(
        ".gsap-title",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-title",
            start: "top 85%",
          },
        }
      );

      // 2. Imagem (Efeito de Zoom Out + Foco)
      // Ela começa um pouco maior (scale: 1.1) e desfocada, e "aterrissa" na tela.
      gsap.fromTo(
        ".gsap-image-container",
        { scale: 0.9, opacity: 0, filter: "blur(10px)" },
        {
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: {
            trigger: ".gsap-image-container",
            start: "top 80%",
          },
        }
      );

      // 3. Caixas de Texto (Vêm da Direita em Cascata)
      gsap.fromTo(
        ".gsap-box",
        { x: 100, opacity: 0 }, // Começam deslocadas para a direita
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2, // Um box entra depois do outro
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".gsap-boxes-container", // Gatilho no pai das caixas
            start: "top 75%",
          },
        }
      );

      // 4. Blob de Fundo (Movimento sutil com Scrub)
      gsap.to(".gsap-blob", {
        y: 100, // Move para baixo conforme rola
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1, // Animação presa ao scroll
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative py-20 px-4 bg-slate-950 border-b border-white/5 overflow-hidden"
    >
      {/* Background Decorativo (Adicionei a classe 'gsap-blob') */}
      <div className="gsap-blob absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
        {/* COLUNA DA ESQUERDA: Título e Imagem */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          {/* Adicionei 'gsap-title' e 'opacity-0' */}
          <h2 className="gsap-title opacity-0 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight font-futura uppercase">
            Entenda o Fluxo <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              do Negócio
            </span>
          </h2>

          {/* Adicionei 'gsap-image-container' e 'opacity-0' */}
          <div className="gsap-image-container opacity-0 relative group w-full max-w-md lg:max-w-full mx-auto lg:mx-0">
            {/* Efeito de borda brilhante na imagem */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[32px] rounded-tl-[12px] opacity-75 blur-md group-hover:opacity-100 transition duration-500"></div>

            <Image
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
              alt="Business meeting"
              width={2070}
              height={1380}
              className="relative w-full h-auto object-cover rounded-[30px] rounded-tl-[10px] border border-white/10 shadow-2xl"
            />
          </div>
        </div>

        {/* COLUNA DA DIREITA: Caixas de Texto */}
        {/* Adicionei 'gsap-boxes-container' para ser o gatilho */}
        <div className="gsap-boxes-container flex-1 flex flex-col gap-4 w-full">
          {/* Box 1 - Adicionei 'gsap-box' e 'opacity-0' */}
          <div className="gsap-box opacity-0 p-6 border border-white/20 hover:border-purple-500/50 rounded-none bg-white/[0.02] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.05] group">
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 font-sans uppercase tracking-wide group-hover:text-[#d73cbe] transition-colors">
              Peça o que precisa
            </h3>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
              Tem uma necessidade? Escolha o tipo de profissional que procura
              (eletricista, cozinheiro, designer, etc.) e descreva o serviço em
              poucos cliques.
            </p>
          </div>

          {/* Box 2 - Adicionei 'gsap-box' e 'opacity-0' */}
          <div className="gsap-box opacity-0 p-6 border border-white/20 hover:border-purple-500/50 rounded-none bg-white/[0.02] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.05] group">
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 font-sans uppercase tracking-wide group-hover:text-[#d73cbe] transition-colors">
              Converse com profissionais
            </h3>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
              Os profissionais recebem sua solicitação e respondem pelo nosso
              chat interno — de forma segura, rápida e sem expor seus dados
              pessoais.
            </p>
          </div>

          {/* Box 3 - Adicionei 'gsap-box' e 'opacity-0' */}
          <div className="gsap-box opacity-0 p-6 border border-white/20 hover:border-purple-500/50 rounded-none bg-white/[0.02] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.05] group">
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 font-sans uppercase tracking-wide group-hover:text-[#d73cbe] transition-colors">
              Combine e feche negócio
            </h3>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
              Negocie valores, prazos e finalize o serviço com o Pagamento
              Seguro (Escrow) dentro da plataforma. O dinheiro só sai quando
              você aprovar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
