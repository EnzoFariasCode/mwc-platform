"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  useGSAP(
    () => {
      gsap.from(".animate-hero", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.2,
      });
    },
    { scope: containerRef },
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location) params.set("local", location);
    router.push(`/search?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section
      ref={containerRef}
      /* 
         🚀 AJUSTE DE INFRA: 
         - Adicionado pt-32 (padding-top) para dar espaço ao Header em telas pequenas.
         - md:pt-20 para telas maiores.
         - Removido min-h-screen para evitar que o conteúdo fique "preso" se a tela for muito baixa.
      */
      className="relative min-h-[100dvh] flex items-center overflow-hidden pt-32 pb-20 md:pt-20 md:pb-0"
    >
      {/* Backgrounds */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* TÍTULO */}
          <h1 className="animate-hero text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.2] md:leading-[1.1]">
            Encontre o profissional <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 animate-gradient bg-300%">
              certo, perto de você.
            </span>
          </h1>

          {/* SUBTÍTULO */}
          <p className="animate-hero text-base md:text-lg text-slate-400 mb-10 max-w-2xl leading-relaxed">
            Explore perfis detalhados, veja avaliações reais e negocie
            diretamente pelo chat. Sem intermediários, simples e rápido.
          </p>

          {/* BARRA DE BUSCA */}
          <div className="animate-hero w-full max-w-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-2xl shadow-purple-900/20">
            <div className="flex-1 flex items-center px-4 h-12 md:h-14 bg-black/20 rounded-xl border border-transparent focus-within:border-purple-500/50 transition-all">
              <Search className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Busque por: Eletricista, Design..."
                className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-500 text-sm md:text-base"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="flex-[0.6] flex items-center px-4 h-12 md:h-14 bg-black/20 rounded-xl border border-transparent focus-within:border-purple-500/50 transition-all">
              <MapPin className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="CEP ou Cidade"
                className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-500 text-sm md:text-base"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <button
              onClick={handleSearch}
              className="h-12 md:h-14 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 active:scale-95"
            >
              Encontrar
            </button>
          </div>

          {/* Tags Populares */}
          <div className="animate-hero mt-8 flex flex-wrap justify-center gap-3 text-xs md:text-sm text-slate-500">
            <span className="w-full md:w-auto">Mais buscados:</span>
            {[
              "Eletricista",
              "Diarista",
              "Mecânico",
              "Advogado",
              "Web Designer",
            ].map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  router.push(`/search?q=${encodeURIComponent(tag)}`)
                }
                className="text-slate-300 hover:text-purple-400 transition-colors underline decoration-slate-700 underline-offset-4 hover:decoration-purple-400 cursor-pointer bg-transparent border-none"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
