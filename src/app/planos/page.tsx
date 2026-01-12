"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Check, ArrowLeft } from "lucide-react";
import LandingHeader from "@/components/landing/landingComponents/LandingHeader";

const plans = [
  {
    title: "Iniciante",
    price: "Grátis",
    period: "",
    description: "Para quem está começando a oferecer serviços.",
    features: [
      "1 Trabalho por vez",
      "Acesso ao Chat",
      "Dashboard Básico",
      "Taxa padrão de serviço",
    ],
    buttonText: "Começar Grátis",
    buttonStyle: "bg-slate-800 text-white border border-white/10",
    highlight: false,
  },
  {
    title: "Starter",
    price: "R$ 14,99",
    period: "/mês",
    description: "Para profissionais que querem mais visibilidade.",
    features: [
      "Até 3 trabalhos simultâneos",
      "Selo de Verificado",
      "Perfil Recomendado na busca",
      "Suporte Prioritário",
      "Taxa reduzida",
    ],
    buttonText: "Assinar Starter",
    buttonStyle: "bg-[#d73cbe] text-white shadow-lg shadow-purple-900/20",
    popular: true,
  },
  {
    title: "Advanced",
    price: "R$ 24,99",
    period: "/mês",
    description: "Para quem quer dominar o mercado e escalar.",
    features: [
      "Até 5 trabalhos simultâneos",
      "Selo de Verificado Gold",
      "Super Recomendado (Topo)",
      "Destaque na Landing Page",
      "Dashboard Analytics Avançado",
      "Menor taxa do mercado",
    ],
    buttonText: "Assinar Advanced",
    buttonStyle:
      "bg-gradient-to-r from-violet-600 to-[#d73cbe] text-white shadow-lg shadow-purple-900/40",
    highlight: true,
  },
];

export default function PlansPage() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    (context, contextSafe) => {
      /* Entrada */
      gsap.fromTo(
        ".gsap-plan-card",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
        }
      );

      const cards = gsap.utils.toArray<HTMLElement>(".gsap-plan-card");

      cards.forEach((card) => {
        const ctaButton =
          card.querySelector<HTMLButtonElement>(".gsap-cta-button");
        const blurOverlay =
          ctaButton?.querySelector<HTMLSpanElement>(".cta-blur");

        const isHighlighted = card.dataset.highlighted === "true";
        const originalScale = isHighlighted ? 1.05 : 1;

        /* HOVER IN */
        const onEnter =
          contextSafe &&
          contextSafe(() => {
            gsap.to(card, {
              y: -6,
              scale: isHighlighted ? 1.04 : 1.02,
              borderColor: "#d73cbe",
              boxShadow: "0 20px 40px -12px rgba(215,60,190,.25)",
              duration: 0.35,
              ease: "power3.out",
            });

            if (ctaButton) {
              gsap.to(ctaButton, {
                scale: 1.04,
                duration: 0.3,
                ease: "power2.out",
              });
            }

            if (blurOverlay) {
              gsap.to(blurOverlay, {
                opacity: 1,
                x: "30%",
                duration: 0.4,
                ease: "power2.out",
              });
            }
          });

        /* HOVER OUT */
        const onLeave =
          contextSafe &&
          contextSafe(() => {
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

            if (ctaButton) {
              gsap.to(ctaButton, {
                scale: 1,
                duration: 0.4,
                ease: "power3.inOut",
              });
            }

            if (blurOverlay) {
              gsap.to(blurOverlay, {
                opacity: 0,
                x: "0%",
                duration: 0.4,
                ease: "power2.inOut",
              });
            }
          });

        if (onEnter && onLeave) {
          card.addEventListener("mouseenter", onEnter);
          card.addEventListener("mouseleave", onLeave);
        }
      });
    },
    { scope: containerRef }
  );

  return (
    <main
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden"
    >
      {/* Header */}
      <header className="fixed top-0 w-full bg-slate-950/80 backdrop-blur border-b border-white/5 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
          <span className="font-bold text-white">
            MWC <span className="text-[#d73cbe]">Planos</span>
          </span>
        </div>
      </header>

      {/* Conteúdo */}
      <section className="pt-32 pb-24 px-4 container mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block mb-4 px-3 py-1 text-sm font-medium border border-purple-300 rounded-md">
            Nossos Planos
          </span>

          <h1 className="text-4xl font-bold text-white mb-4">
            Escolha o nível da sua carreira
          </h1>

          <p className="text-slate-400 max-w-xl mx-auto">
            Cancele quando quiser. Sem burocracia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              data-highlighted={plan.highlight}
              className={`gsap-plan-card relative p-8 rounded-3xl cursor-default will-change-transform transition-colors
                ${
                  plan.highlight
                    ? "bg-slate-900/80 border-2 border-[#d73cbe] scale-105"
                    : "bg-white/5 border border-white/10"
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#d73cbe] text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg shadow-purple-900/50">
                  Mais Popular
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-2">
                {plan.title}
              </h3>

              <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

              <div className="text-4xl font-bold text-white mb-6">
                {plan.price}
                <span className="text-sm text-slate-500 ml-1">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8 text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex gap-2 text-slate-300">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/cadastro" className="block w-full">
                <button
                  // AQUI: Adicionado cursor-pointer e hover:brightness para feedback visual
                  className={`gsap-cta-button cursor-pointer relative overflow-hidden w-full py-4 rounded-xl font-bold text-sm transition-transform active:scale-95 ${plan.buttonStyle}`}
                >
                  <span className="relative z-10">{plan.buttonText}</span>
                  <span className="cta-blur absolute inset-0 opacity-0 bg-white/20 backdrop-blur-sm" />
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
