"use client";

import { useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Imports das imagens
import eletricista from "@/assets/images/landingPage/eletricista.jpg";
import encanador from "@/assets/images/landingPage/encanador.jpg";
import diarista from "@/assets/images/landingPage/diarista.jpg";
import pedreiro from "@/assets/images/landingPage/pedreiro.webp";
import desenvolvedor from "@/assets/images/landingPage/sitecreator.webp";
import promotor from "@/assets/images/landingPage/promotor.jpg";

// Registramos o Plugin
gsap.registerPlugin(ScrollTrigger);

export const services = [
  { title: "Eletricista", imgSrc: eletricista },
  { title: "Encanador", imgSrc: encanador },
  { title: "Diarista", imgSrc: diarista },
  { title: "Pedreiro", imgSrc: pedreiro },
  { title: "Desenvolvedor Web", imgSrc: desenvolvedor },
  { title: "Promotor", imgSrc: promotor },
];

function ServicesSection() {
  const containerRef = useRef<HTMLElement>(null);
  const router = useRouter(); // 2. Instanciar o roteador

  useGSAP(
    () => {
      // 1. Título
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
        },
      );

      // 2. Cards
      const cards = gsap.utils.toArray<HTMLElement>(".gsap-card");

      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 100 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    },
    { scope: containerRef },
  );

  // Função para navegar para a busca com o filtro
  const handleServiceClick = (serviceTitle: string) => {
    // encodeURIComponent garante que espaços e acentos não quebrem a URL
    router.push(`/search?q=${encodeURIComponent(serviceTitle)}`);
  };

  return (
    <section
      id="servicesSection"
      ref={containerRef}
      className="relative border-b border-white/5 bg-slate-950 px-4 py-16 overflow-hidden lg:py-20"
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="gsap-title mb-10 text-center font-futura text-3xl font-bold uppercase opacity-0 md:text-4xl lg:mb-12">
          Basta escolher um <span className="text-[#d73cbe]">serviço</span>
        </h2>

        <div className="gsap-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              // 3. Adicionei o onClick aqui para tornar o card inteiro clicável
              onClick={() => handleServiceClick(service.title)}
              className="gsap-card opacity-0 group relative h-[280px] rounded-lg overflow-hidden cursor-pointer shadow-lg hover:-translate-y-2 transition-transform duration-300 ease-out"
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

                {/* O botão agora é visual, o clique no pai (div) que comanda a ação */}
                <button className="bg-[#d73cbe] hover:bg-[#c02aa8] text-white px-6 py-2.5 rounded-md font-medium text-sm transition-all shadow-[0_4px_14px_0_rgba(215,60,190,0.39)] hover:shadow-[0_6px_20px_rgba(215,60,190,0.23)] hover:scale-105 flex items-center gap-2 pointer-events-none">
                  Fazer Orçamento
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
