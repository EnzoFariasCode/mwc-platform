"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function WorkerSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useGSAP(
    () => {
      // 1. Animação do Texto (Vem da Esquerda)
      gsap.fromTo(
        ".gsap-worker-text",
        { x: -100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-worker-text",
            start: "top 80%",
          },
        }
      );

      // 2. Animação do Vídeo (Zoom In + Rotação Inicial)
      gsap.fromTo(
        ".gsap-worker-video",
        { scale: 0.5, opacity: 0, rotation: -180 }, // Começa pequeno e girado ao contrário
        {
          scale: 1,
          opacity: 1,
          rotation: 0, // Termina alinhado
          duration: 1.2,
          ease: "back.out(1.5)", // Efeito elástico (passa um pouco do tamanho e volta)
          scrollTrigger: {
            trigger: ".gsap-worker-video",
            start: "top 85%",
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative py-24 px-4 bg-slate-950 border-b border-white/5 overflow-hidden"
    >
      {/* Container Principal */}
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
        {/* Lado Esquerdo: Texto */}
        {/* Adicionei 'gsap-worker-text' e 'opacity-0' */}
        <div className="gsap-worker-text opacity-0 flex-1 flex flex-col gap-8 max-w-2xl text-center lg:text-left">
          <div className="border border-white/20 p-8 md:p-12 rounded-none bg-white/[0.02] backdrop-blur-sm relative group">
            {/* Decoração de canto neon */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#d73cbe]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#d73cbe]" />

            <h2 className="text-3xl md:text-5xl font-bold font-futura uppercase tracking-tight text-white mb-6 leading-none">
              É um <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[#d73cbe]">
                Profissional?
              </span>
            </h2>

            <p className="text-slate-300 text-lg leading-relaxed mb-8 font-sans">
              Se você é um prestador de serviços e se vê capaz de atuar com
              diversas demandas, esse site é pra você.
              <br />
              <br />
              Veja nosso vídeo e entenda como você pode se tornar um
              profissional na MCW e começar hoje mesmo.
            </p>

            <Link href="/beWorker">
              <button className="bg-[#d73cbe] hover:bg-[#b0269a] cursor-pointer text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(215,60,190,0.4)] hover:shadow-[0_0_30px_rgba(215,60,190,0.6)] hover:-translate-y-1">
                Quero ser um profissional
              </button>
            </Link>
          </div>
        </div>

        {/* Lado Direito: Vídeo Circular com Borda Giratória */}
        {/* Adicionei 'gsap-worker-video' e 'opacity-0' */}
        <div className="gsap-worker-video opacity-0 relative flex-shrink-0 w-[300px] h-[300px] md:w-[450px] md:h-[450px] flex items-center justify-center">
          {/* Borda Giratória (Conic Gradient) */}
          <div
            className="absolute inset-0 rounded-full animate-spin-slow"
            style={{
              background:
                "conic-gradient(#ff00ff, #6600ff, #0066ff, #00ccff, #ff00ff)",
              filter: "blur(10px)",
              opacity: 0.8,
            }}
          />
          {/* Segunda borda para dar nitidez */}
          <div
            className="absolute inset-0 rounded-full animate-spin-slow"
            style={{
              background:
                "conic-gradient(#ff00ff, #6600ff, #0066ff, #00ccff, #ff00ff)",
            }}
          />

          {/* Wrapper do Vídeo */}
          <div
            className="relative z-10 w-[calc(100%-16px)] h-[calc(100%-16px)] bg-black rounded-full overflow-hidden border-4 border-slate-900 cursor-pointer group"
            onClick={togglePlay}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src="https://videos.pexels.com/video-files/3196344/3196344-sd_640_360_25fps.mp4"
              playsInline
              onEnded={() => setIsPlaying(false)}
            />

            {/* Overlay de Play */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl transition-transform group-hover:scale-110">
                  <Play className="w-8 h-8 text-white fill-current ml-1" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
