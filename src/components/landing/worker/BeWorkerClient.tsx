"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  MessageSquare,
  Wallet,
  Zap,
  CheckCircle2,
} from "lucide-react";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import heroBg from "@/assets/images/howToBeWorker/hero-bg.jpg";
import dashboard from "@/assets/images/howToBeWorker/dashboard-mockup.png";

// Importa o PricingSection (que agora tem as classes certas)
import { PricingSection } from "@/components/landing/PricingSection/index";

gsap.registerPlugin(ScrollTrigger);

// ... (Subcomponentes SvgButton e FeatureCard continuam iguais, não precisa alterar) ...
const SvgButton = ({ text, href }: { text: string; href: string }) => (
  <div className="relative w-[240px] h-[60px] group">
    <Link href={href} className="block w-full h-full relative z-10">
      <button className="w-full h-full cursor-pointer bg-transparent outline-none relative flex items-center justify-center">
        <svg
          width="240px"
          height="60px"
          viewBox="0 0 240 60"
          className="absolute top-0 left-0 fill-none stroke-[#d73cbe] transition-all duration-1000 ease-in-out [stroke-dasharray:150_600] [stroke-dashoffset:150] group-hover:[stroke-dashoffset:-600] group-hover:fill-[#d73cbe]/10"
        >
          <polyline points="239,1 239,59 1,59 1,1 239,1" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 border border-white/20 pointer-events-none transition-opacity duration-500 group-hover:opacity-0"></div>
        <span className="text-white text-base font-bold tracking-widest uppercase relative z-20">
          {text}
        </span>
      </button>
    </Link>
  </div>
);

function FeatureCard({
  icon,
  title,
  desc,
  className = "",
}: {
  icon: any;
  title: string;
  desc: string;
  className?: string;
}) {
  return (
    <div
      className={`p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-1 ${className}`}
    >
      <div className="mb-4 p-3 rounded-lg bg-slate-950 w-fit border border-white/5">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

interface BeWorkerClientProps {
  isLoggedIn: boolean;
  userStatus: "active" | "inactive" | null;
}

export default function BeWorkerClient({
  isLoggedIn,
  userStatus,
}: BeWorkerClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    (context, contextSafe) => {
      // contextSafe é necessário para os eventos de mouse
      const tl = gsap.timeline();

      // 1. HERO ANIMATION
      tl.fromTo(
        ".gsap-hero-title",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
      )
        .fromTo(
          ".gsap-hero-text",
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
          "-=0.6",
        )
        .fromTo(
          ".gsap-hero-btn",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.2, ease: "power2.out" },
          "-=0.5",
        );

      // 2. FEATURES ANIMATION
      gsap.fromTo(
        ".gsap-feature-card",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: { trigger: "#como-funciona", start: "top 75%" },
        },
      );

      // 3. DASHBOARD ANIMATION
      gsap.fromTo(
        ".gsap-dash-content",
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".gsap-dash-section", start: "top 70%" },
        },
      );
      gsap.fromTo(
        ".gsap-dash-image",
        { x: 50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          delay: 0.2,
          ease: "power3.out",
          scrollTrigger: { trigger: ".gsap-dash-section", start: "top 70%" },
        },
      );

      // 4. PLANOS PREMIUM ANIMATION (RESTAURADO)
      gsap.fromTo(
        ".gsap-plan-card-premium", // Agora essa classe existe dentro do PricingSection
        { y: 60, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#planos", // O ID #planos está no PricingSection, o ScrollTrigger consegue ver
            start: "top 70%",
          },
        },
      );

      // 5. HOVER EFFECTS NOS CARDS (RESTAURADO)
      if (contextSafe) {
        const cards = gsap.utils.toArray<HTMLElement>(
          ".gsap-plan-card-premium",
        );

        cards.forEach((card) => {
          const ctaButton =
            card.querySelector<HTMLButtonElement>(".gsap-cta-button");
          const blurOverlay =
            ctaButton?.querySelector<HTMLSpanElement>(".cta-blur");
          const isHighlighted = card.dataset.highlighted === "true"; // Pegamos o data attribute
          const originalScale = 1;

          const onEnter = contextSafe(() => {
            gsap.to(card, {
              y: -10,
              scale: 1.02,
              borderColor: "#d73cbe",
              boxShadow: "0 20px 40px -12px rgba(215,60,190,.25)",
              duration: 0.35,
              ease: "power3.out",
            });
            if (ctaButton)
              gsap.to(ctaButton, {
                scale: 1.05,
                duration: 0.3,
                ease: "power2.out",
              });
            if (blurOverlay)
              gsap.to(blurOverlay, {
                opacity: 1,
                x: "30%",
                duration: 0.4,
                ease: "power2.out",
              });
          });

          const onLeave = contextSafe(() => {
            gsap.to(card, {
              y: 0,
              scale: originalScale,
              borderColor: isHighlighted ? "#d73cbe" : "rgba(255,255,255,.1)",
              boxShadow: isHighlighted
                ? "0 0 40px -10px rgba(215,60,190,.3)"
                : "none",
              duration: 0.45,
              ease: "power3.inOut",
            });
            if (ctaButton)
              gsap.to(ctaButton, {
                scale: 1,
                duration: 0.4,
                ease: "power3.inOut",
              });
            if (blurOverlay)
              gsap.to(blurOverlay, {
                opacity: 0,
                x: "0%",
                duration: 0.4,
                ease: "power2.inOut",
              });
          });

          card.addEventListener("mouseenter", onEnter);
          card.addEventListener("mouseleave", onLeave);
        });
      }
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-0 bg-slate-950 overflow-x-hidden"
    >
      {/* ... Hero, Como Funciona e Dashboard ... (Mantém igual) */}
      <section className="relative py-24 lg:py-32 overflow-hidden min-h-[650px] flex items-center">
        <div
          className="absolute inset-0 z-0 bg-no-repeat bg-cover bg-fixed bg-center-bottom opacity-60"
          style={{ backgroundImage: `url(${heroBg.src})` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/70"></div>
        <div className="container mx-auto px-4 relative z-10 text-center flex flex-col items-center">
          <h1 className="gsap-hero-title opacity-0 text-4xl md:text-5xl lg:text-6xl font-bold font-futura text-white mb-6 leading-tight drop-shadow-2xl">
            Transforme suas habilidades <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d73cbe] to-violet-400">
              em Renda Extra e Recorrente
            </span>
          </h1>
          <p className="gsap-hero-text opacity-0 text-slate-200 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed drop-shadow-lg font-medium">
            O método mais seguro e descomplicado do mercado. Você foca no
            trabalho, nós garantimos o pagamento e a segurança.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full">
            <div className="gsap-hero-btn opacity-0">
              <SvgButton text="Começar Agora" href="/login" />
            </div>
            <div className="gsap-hero-btn opacity-0">
              <SvgButton text="Ver Processo" href="#como-funciona" />
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4 font-futura">
              Como Funciona?
            </h2>
            <p className="text-slate-400">
              Sem burocracia desnecessária. Simples e direto.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              className="gsap-feature-card opacity-0"
              icon={<Zap className="w-8 h-8 text-[#d73cbe]" />}
              title="1. Receba & Dê Lances"
              desc="Visualize projetos postados por clientes reais e envie sua proposta na hora."
            />
            <FeatureCard
              className="gsap-feature-card opacity-0"
              icon={<MessageSquare className="w-8 h-8 text-violet-400" />}
              title="2. Chat Interno"
              desc="Negocie detalhes e tire dúvidas diretamente com o cliente pelo nosso chat seguro."
            />
            <FeatureCard
              className="gsap-feature-card opacity-0"
              icon={<ShieldCheck className="w-8 h-8 text-emerald-400" />}
              title="3. Segurança Total"
              desc="O valor do serviço fica retido conosco. Você tem a garantia que vai receber."
            />
            <FeatureCard
              className="gsap-feature-card opacity-0"
              icon={<Wallet className="w-8 h-8 text-blue-400" />}
              title="4. Receba o Valor"
              desc="Assim que o cliente aprovar a entrega, o valor é liberado para sua conta."
            />
          </div>
        </div>
      </section>

      <section className="gsap-dash-section py-20 border-t border-white/5 bg-slate-950 overflow-hidden">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="gsap-dash-content opacity-0 flex-1 space-y-6">
            <h2 className="text-4xl font-bold text-white font-futura">
              Controle total na palma da mão
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Diferente de outros sites, aqui você tem um Dashboard completo.
              Acompanhe suas notas, feedbacks de clientes, faturamento mensal e
              status de cada projeto em tempo real.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="text-[#d73cbe] w-5 h-5" /> Gestão de
                reputação
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="text-[#d73cbe] w-5 h-5" /> Histórico
                financeiro
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="text-[#d73cbe] w-5 h-5" /> Chat
                centralizado
              </li>
            </ul>
          </div>
          <div className="gsap-dash-image opacity-0 flex-1 w-full h-64 md:h-96 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 flex items-center justify-center relative overflow-hidden group hover:border-[#d73cbe]/30 transition-colors duration-500">
            <div className="absolute inset-0 bg-[#d73cbe]/5 group-hover:bg-[#d73cbe]/10 transition-colors"></div>
            <div className="p-4 relative w-full h-full flex items-center justify-center">
              <Image
                src={dashboard}
                alt="Dashboard"
                className="object-contain max-h-full opacity-90 group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Planos (Agora animados pois as classes estão lá) */}
      <PricingSection isLoggedIn={isLoggedIn} userStatus={userStatus} />
    </div>
  );
}
