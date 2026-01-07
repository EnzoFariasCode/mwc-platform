"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Imports das imagens (mantém igual)
import eletricista from "@/assets/images/landingPage/eletricista.jpg";
import encanador from "@/assets/images/landingPage/encanador.avif";
import designer from "@/assets/images/landingPage/logocreator.webp";
import pedreiro from "@/assets/images/landingPage/pedreiro.webp";
import desenvolvedor from "@/assets/images/landingPage/sitecreator.webp";
import videomaker from "@/assets/images/landingPage/videomaker.webp";

// Registramos o Plugin (Importante fazer isso uma vez)
gsap.registerPlugin(ScrollTrigger);

export const services = [
  { title: "Eletricista", imgSrc: eletricista },
  { title: "Encanador", imgSrc: encanador },
  { title: "Designer Gráfico", imgSrc: designer },
  { title: "Pedreiro", imgSrc: pedreiro },
  { title: "Desenvolvedor Web", imgSrc: desenvolvedor },
  { title: "Videomaker", imgSrc: videomaker },
];

function ServicesSection() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // 1. Título (Mantém igual, anima uma vez só)
      gsap.fromTo(
        ".gsap-title",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-title",
            start: "top 85%",
          },
        }
      );

      // 2. Cards (MUDANÇA AQUI: Loop para criar um gatilho para CADA card)
      const cards = gsap.utils.toArray<HTMLElement>(".gsap-card"); // Pega todos os cards

      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 100 }, // Começa invisível e embaixo
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card, // O gatilho é o PRÓPRIO card
              start: "top 85%", // Anima quando O CARD entrar em 85% da tela
              toggleActions: "play none none reverse", // (Opcional) Se subir, ele some de novo. Se quiser que fique fixo, tire essa linha.
            },
          }
        );
      });

      // 3. Linha (Mantém igual)
      gsap.fromTo(
        ".gsap-line",
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 1.5,
          ease: "expo.out",
          scrollTrigger: {
            trigger: ".gsap-line",
            start: "top 90%",
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative py-24 px-4 bg-slate-950 overflow-hidden"
    >
      <div className="max-w-5xl mx-auto">
        {/* Adicionei a classe 'gsap-title' */}
        <h2 className="gsap-title text-3xl md:text-4xl font-bold text-center mb-12 uppercase font-futura opacity-0">
          Basta escolher um <span className="text-[#d73cbe]">serviço</span>
        </h2>

        {/* Adicionei a classe 'gsap-grid' no pai para servir de trigger */}
        <div className="gsap-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              // Adicionei a classe 'gsap-card' e 'opacity-0' para começar invisível
              className="gsap-card opacity-0 group relative h-[280px] rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:-translate-y-2 transition-transform duration-300 ease-out"
            >
              <Image
                src={service.imgSrc}
                alt={service.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                placeholder="blur"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 z-10" />

              <div className="absolute bottom-0 left-0 w-full p-6 text-center z-20 flex flex-col items-center">
                <h3 className="text-xl font-bold text-white mb-4 font-sans tracking-wide">
                  {service.title}
                </h3>

                <button className="bg-[#d73cbe] hover:bg-[#c02aa8] text-white px-6 py-2 rounded-full font-medium text-sm transition-all shadow-[0_4px_14px_0_rgba(215,60,190,0.39)] hover:shadow-[0_6px_20px_rgba(215,60,190,0.23)] hover:scale-105 flex items-center gap-2">
                  Fazer Orçamento
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Adicionei a classe 'gsap-line' */}
        <div className="gsap-line mt-24 h-px w-full max-w-2xl mx-auto bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </div>
    </section>
  );
}

export default ServicesSection;
