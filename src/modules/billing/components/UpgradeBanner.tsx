"use client";

import { useState } from "react";
import {
  Check,
  X,
  Zap,
  Crown,
  ShieldCheck,
  Rocket,
  Settings,
  Loader2,
} from "lucide-react";
import { createCheckoutSession } from "@/modules/stripe/actions/create-checkout-session";
import { createPortalSession } from "@/modules/stripe/actions/create-portal-session";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Dados dos Planos
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

export function UpgradeBanner({ isPro }: { isPro: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const router = useRouter();

  // Função para comprar (Checkout)
  const handleSubscribe = async (planId: string) => {
    setLoadingId(planId);
    try {
      const result = await createCheckoutSession(
        planId as "starter" | "advanced",
      );

      if (!result.success) {
        // 🛡️ O TRUQUE DE SEGURANÇA: Garantimos que sempre haverá um texto (fallback)
        const errorMessage = result.error || "Erro desconhecido";

        toast.error(errorMessage);
        if (errorMessage.includes("logado")) router.push("/login");
        if (result.data?.url) router.push(result.data.url);
      } else if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch {
      toast.error("Erro ao iniciar pagamento.");
    } finally {
      setLoadingId(null);
    }
  };

  // Função para Gerenciar (Portal)
  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const result = await createPortalSession();
      if (!result.success) {
        toast.error(result.error);
      } else if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch {
      toast.error("Erro ao abrir configurações.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  // --- CENÁRIO: USUÁRIO JÁ É PRO ---
  if (isPro) {
    return (
      <div className="bg-gradient-to-r from-emerald-950 to-emerald-900 rounded-2xl p-6 md:p-8 border border-emerald-500/30 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Lado Esquerdo: Texto */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-full border border-emerald-500/30 shrink-0">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Assinatura Ativa
              <span className="px-2 py-0.5 bg-emerald-500 text-emerald-950 text-[10px] font-bold uppercase rounded-full">
                Pro
              </span>
            </h2>
            <p className="text-emerald-200/70 text-sm mt-1 max-w-md">
              Você tem acesso total à plataforma. Seu perfil está destacado e
              suas taxas são reduzidas.
            </p>
          </div>
        </div>

        {/* Lado Direito: Botão de Gerenciar */}
        <div className="relative z-10 w-full md:w-auto">
          <button
            onClick={handleManageSubscription}
            disabled={isPortalLoading}
            className="w-full md:w-auto px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPortalLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4" /> Gerenciar Plano
              </>
            )}
          </button>
        </div>

        {/* Efeito de fundo */}
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
      </div>
    );
  }

  // --- CENÁRIO: USUÁRIO FREE ---
  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-8 border border-indigo-500/20 relative overflow-hidden group">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-[#d73cbe] text-white text-[10px] font-bold uppercase rounded-md tracking-wider">
              Recomendado
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 font-futura">
            Desbloqueie o Potencial Máximo
          </h2>
          <p className="text-slate-300 mb-6 text-sm md:text-base max-w-lg leading-relaxed">
            Profissionais PRO aparecem 5x mais nas buscas, têm selo de
            verificado e pagam taxas menores. Não perca oportunidades.
          </p>

          <button
            onClick={() => setIsOpen(true)}
            className="px-8 py-3 bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/40 hover:-translate-y-1 flex items-center gap-2 cursor-pointer group/btn"
          >
            <Crown className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
            Ver Planos e Vantagens
          </button>
        </div>

        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#d73cbe]/10 to-transparent pointer-events-none" />
        <Zap className="absolute -right-6 -bottom-6 w-48 h-48 text-indigo-500/10 rotate-12" />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors z-20"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8 md:p-12">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-3 font-futura">
                  Escolha seu nível de atuação
                </h2>
                <p className="text-slate-400">
                  Invista na sua carreira e recupere o valor no primeiro
                  projeto.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {plansData.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-6 md:p-8 rounded-2xl border transition-all ${
                      plan.highlight
                        ? "bg-slate-900/80 border-[#d73cbe] shadow-xl shadow-purple-900/20"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#d73cbe] text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-lg">
                        Mais Popular
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {plan.title}
                        </h3>
                        <p className="text-slate-400 text-xs mt-1">
                          {plan.description}
                        </p>
                      </div>
                      {plan.id === "advanced" ? (
                        <Zap className="w-6 h-6 text-[#d73cbe]" />
                      ) : (
                        <Rocket className="w-6 h-6 text-purple-400" />
                      )}
                    </div>

                    <div className="text-3xl font-bold text-white mb-6">
                      {plan.price}
                      <span className="text-sm text-slate-500 ml-1 font-normal">
                        {plan.period}
                      </span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex gap-3 text-sm text-slate-300"
                        >
                          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loadingId !== null}
                      className={`w-full py-4 rounded-xl font-bold text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 ${
                        loadingId !== null && loadingId !== plan.id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      } ${plan.buttonStyle}`}
                    >
                      {loadingId === plan.id ? (
                        "Redirecionando..."
                      ) : (
                        <>
                          {plan.buttonText} <ArrowRightArrow />
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-slate-500 mt-8">
                Pagamento seguro processado pelo Stripe. Cancele a qualquer
                momento.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const ArrowRightArrow = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);
