"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Check, ArrowLeft, Star, Shield, Zap } from "lucide-react";

// Dados dos Planos (Mantidos)
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
    // Removi classes de hover do tailwind daqui para não conflitar
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
    // Removi classes de hover do tailwind
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
    // Removi classes de hover do tailwind
    buttonStyle:
      "bg-gradient-to-r from-violet-600 to-[#d73cbe] text-white shadow-lg shadow-purple-900/40",
    highlight: true,
  },
];

export default function PlansPage() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    (_, contextSafe) => {
      // 1. Animação de Entrada (Mantida)
      gsap.fromTo(
        ".gsap-plan-card",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
        }
      );

      gsap.from(".gsap-header", {
        y: -30,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.2,
      });

      // 2. Lógica de HOVER Avançada com GSAP
      // Usamos contextSafe para garantir que os event listeners sejam limpos corretamente
      const cards = gsap.utils.toArray<HTMLElement>(".gsap-plan-card");

      cards.forEach((card) => {
        const ctaButton = card.querySelector(".gsap-cta-button");
        const isHighlighted = card.dataset.highlighted === "true";

        // Estado original do card (para saber como voltar)
        const originalState = {
          borderColor: isHighlighted ? "#d73cbe" : "rgba(255, 255, 255, 0.1)",
          backgroundColor: isHighlighted
            ? "rgba(15, 23, 42, 0.8)"
            : "rgba(255, 255, 255, 0.05)",
          boxShadow: isHighlighted
            ? "0 0 40px -10px rgba(215,60,190,0.3)"
            : "none",
          scale: isHighlighted ? 1.05 : 1,
        };

        // --- HOVER IN (Mouse Entra) ---
        const onEnter =
          contextSafe &&
          contextSafe(() => {
            // Anima o CARD
            gsap.to(card, {
              y: -12, // Lift
              scale: isHighlighted ? 1.08 : 1.03, // Scale leve (considera se já está grande)
              borderColor: "#d73cbe", // Destaque na borda
              backgroundColor: "rgba(215, 60, 190, 0.05)", // Fundo levemente roxo
              boxShadow: "0 25px 50px -12px rgba(215, 60, 190, 0.25)", // Sombra forte roxa
              duration: 0.4,
              ease: "power3.out",
              overwrite: "auto",
            });

            // Anima o BOTÃO CTA (Destaque extra)
            if (ctaButton) {
              gsap.to(ctaButton, {
                scale: 1.05, // Scale no botão
                brightness: 1.2, // Fica mais brilhante
                boxShadow: "0 10px 20px -5px rgba(215, 60, 190, 0.5)", // Sombra específica do botão
                duration: 0.3,
                ease: "back.out(1.5)", // Um "pulo" sutil
                overwrite: "auto",
              });
            }
          });

        // --- HOVER OUT (Mouse Sai) ---
        const onLeave =
          contextSafe &&
          contextSafe(() => {
            // Volta o CARD ao estado original
            gsap.to(card, {
              y: 0,
              scale: originalState.scale,
              borderColor: originalState.borderColor,
              backgroundColor: originalState.backgroundColor,
              boxShadow: originalState.boxShadow,
              duration: 0.5,
              ease: "power3.inOut",
              overwrite: "auto",
            });

            // Volta o BOTÃO CTA ao normal
            if (ctaButton) {
              gsap.to(ctaButton, {
                scale: 1,
                brightness: 1,
                boxShadow: "none", // Simplificação: remove a sombra extra do hover
                duration: 0.5,
                ease: "power3.inOut",
                overwrite: "auto",
              });
            }
          });

        // Adiciona os listeners
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
      className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30 selection:text-white relative overflow-hidden"
    >
      {/* Background Decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Navbar */}
      <header className="fixed top-0 left-0 w-full bg-slate-950/80 backdrop-blur-md border-b border-white/5 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Home
          </Link>
          <span className="font-futura font-bold text-xl tracking-tight text-white">
            MWC<span className="text-[#d73cbe]">JOBS</span>
          </span>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="pt-32 pb-24 px-4 container mx-auto relative z-10">
        {/* Header da Página */}
        <div className="gsap-header text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block py-1 px-3 rounded-full bg-purple-500/10 text-purple-400 text-sm font-bold mb-4 border border-purple-500/20">
            Nossos Planos
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-futura text-white">
            Escolha o nível da sua{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              carreira
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Seja você um iniciante ou um expert, temos a ferramenta certa para
            alavancar seus ganhos. Cancele a qualquer momento.
          </p>
        </div>

        {/* Grid de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start mb-24">
          {plans.map((plan, index) => (
            <div
              key={index}
              // Adicionamos data-highlighted para o GSAP saber o estado inicial
              data-highlighted={plan.highlight}
              // Removemos todas as classes de hover/transition do CSS
              className={`gsap-plan-card relative flex flex-col p-8 rounded-3xl cursor-default will-change-transform
                ${
                  plan.highlight
                    ? "bg-slate-900/80 border-2 border-[#d73cbe] shadow-[0_0_40px_-10px_rgba(215,60,190,0.3)] z-10 scale-105 md:-mt-4 backdrop-blur-xl"
                    : "bg-white/5 border border-white/10 backdrop-blur-sm"
                }
              `}
            >
              {/* Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#d73cbe] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg pointer-events-none">
                  Mais Popular
                </div>
              )}
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-[#d73cbe] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1 pointer-events-none">
                  <Star className="w-3 h-3 fill-current" /> Recomendado
                </div>
              )}

              {/* Cabeçalho do Card */}
              <div className="mb-8 pointer-events-none">
                <h3 className="text-xl font-bold text-white mb-2">
                  {plan.title}
                </h3>
                <p className="text-slate-400 text-sm h-10">
                  {plan.description}
                </p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-bold text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-slate-500 ml-1 font-medium">
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Lista de Features */}
              <ul className="space-y-4 mb-8 flex-1 pointer-events-none">
                {plan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-slate-300 text-sm"
                  >
                    <div
                      className={`mt-0.5 p-0.5 rounded-full shrink-0 ${
                        plan.highlight
                          ? "bg-purple-500 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Botão de Ação */}
              <Link href="/cadastro" className="mt-auto">
                {/* Adicionamos a classe 'gsap-cta-button' e removemos hovers CSS */}
                <button
                  className={`gsap-cta-button w-full py-4 rounded-xl font-bold text-sm transition-colors shadow-lg will-change-transform ${plan.buttonStyle}`}
                >
                  {plan.buttonText}
                </button>
              </Link>

              {/* Footerzinho */}
              <p className="text-center text-xs text-slate-500 mt-4 pointer-events-none">
                {plan.price === "Grátis"
                  ? "Sem cartão de crédito necessário"
                  : "7 dias de garantia ou reembolso"}
              </p>
            </div>
          ))}
        </div>

        {/* FAQ Rápido (Mantido igual) */}
        <div className="border-t border-white/5 pt-16 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center group">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white mb-2">Pagamento Seguro</h4>
              <p className="text-sm text-slate-400">
                Dados criptografados e processados com segurança máxima.
              </p>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white mb-2">Ativação Imediata</h4>
              <p className="text-sm text-slate-400">
                Assine e comece a ter as vantagens na mesma hora.
              </p>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                <Star className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white mb-2">
                Cancele quando quiser
              </h4>
              <p className="text-sm text-slate-400">
                Sem contratos longos ou multas. Você no controle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
