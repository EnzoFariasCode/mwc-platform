"use client";

import { useState } from "react";
import {
  Check,
  Loader2,
  Rocket,
  Zap,
  Settings,
  ArrowRight,
} from "lucide-react";
import { createCheckoutSession } from "@/actions/stripe/create-checkout-session";
import { createPortalSession } from "@/actions/stripe/create-portal-session";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const plansData = [
  {
    id: "starter",
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
    highlight: false,
    popular: true,
  },
  {
    id: "advanced",
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
    popular: false,
  },
];

interface PricingSectionProps {
  userStatus?: "active" | "inactive" | null;
  isLoggedIn: boolean;
}

export function PricingSection({
  userStatus,
  isLoggedIn,
}: PricingSectionProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async (planId: string) => {
    setLoadingId(planId);

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (userStatus === "active") {
      try {
        const result = await createPortalSession();
        if (result.url) window.location.href = result.url;
        else toast.error(result.error || "Erro ao abrir portal.");
      } catch {
        toast.error("Erro ao conectar com Stripe.");
      } finally {
        setLoadingId(null);
      }
      return;
    }

    try {
      const result = await createCheckoutSession(
        planId as "starter" | "advanced",
      );

      if (result.error) {
        toast.error(result.error);
        if (result.redirectUrl) router.push(result.redirectUrl);
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error("Erro ao iniciar pagamento.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section id="planos" className="py-24 relative bg-slate-900/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-futura">
            Escolha seu nível de atuação
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Comece gratuitamente ou acelere seus resultados com nossos planos
            Pro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {/* --- PLANO GRATUITO --- */}
          <div
            // Adicionada classe para o GSAP pegar (mesmo que não tenha highlight)
            className="gsap-plan-card-premium bg-white/5 border border-white/10 p-8 rounded-3xl opacity-0"
          >
            <h3 className="text-xl font-bold text-white mb-2">Gratuito</h3>
            <p className="text-slate-400 text-sm mb-6">
              Para quem está começando.
            </p>
            <div className="text-4xl font-bold text-white mb-6">R$ 0,00</div>
            <ul className="space-y-3 mb-8 text-sm text-slate-300">
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-slate-500" /> 1 Trabalho por vez
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-slate-500" /> Taxa padrão (20%)
              </li>
            </ul>
            <button
              onClick={() =>
                isLoggedIn
                  ? router.push("/dashboard/profissional")
                  : router.push("/cadastro")
              }
              className="gsap-cta-button w-full py-4 rounded-xl font-bold text-sm bg-slate-800 text-white hover:bg-slate-700 transition-colors cursor-pointer relative overflow-hidden"
            >
              <span className="relative z-10">
                {isLoggedIn ? "Acessar Painel" : "Começar Grátis"}
              </span>
            </button>
          </div>

          {/* --- PLANOS PAGOS --- */}
          {plansData.map((plan) => (
            <div
              key={plan.id}
              // IMPORTANTE: Adicionado 'gsap-plan-card-premium' e 'opacity-0' para o GSAP animar a entrada
              // Adicionado data-highlighted para o efeito de hover
              data-highlighted={plan.highlight}
              className={`gsap-plan-card-premium relative p-8 rounded-3xl transition-colors opacity-0
                ${
                  plan.highlight
                    ? "bg-slate-900/80 border-2 border-[#d73cbe]"
                    : "bg-white/5 border border-white/10"
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#d73cbe] text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                  Mais Popular
                </div>
              )}

              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-white">{plan.title}</h3>
                {plan.id === "advanced" ? (
                  <Zap className="w-5 h-5 text-[#d73cbe]" />
                ) : (
                  <Rocket className="w-5 h-5 text-purple-400" />
                )}
              </div>

              <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

              <div className="text-4xl font-bold text-white mb-6">
                {plan.price}{" "}
                <span className="text-sm text-slate-500 ml-1">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8 text-sm text-slate-300">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleAction(plan.id)}
                disabled={loadingId !== null}
                // IMPORTANTE: Adicionado 'gsap-cta-button' e o span 'cta-blur'
                className={`gsap-cta-button w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${plan.buttonStyle}`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loadingId === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : userStatus === "active" ? (
                    <>
                      <Settings className="w-4 h-4" /> Gerenciar Assinatura
                    </>
                  ) : (
                    <>
                      {plan.buttonText} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </span>
                {/* Efeito de blur no hover */}
                <span className="cta-blur absolute inset-0 opacity-0 bg-white/20 backdrop-blur-sm pointer-events-none" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
