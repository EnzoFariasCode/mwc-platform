"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  Check,
  X,
  Zap,
  Crown,
  ShieldCheck,
  Rocket,
  Settings,
  Loader2,
  LifeBuoy,
} from "lucide-react";
import { createCheckoutSession } from "@/modules/stripe/actions/create-checkout-session";
import { createPortalSession } from "@/modules/stripe/actions/create-portal-session";
import { requestTechSupport } from "@/modules/support/actions/request-tech-support";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type {
  TechPaidPlanId,
  TechPlanDisplayPrices,
} from "@/modules/subscriptions/tech-plan-pricing";

const plansData: Array<{
  id: TechPaidPlanId;
  title: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonStyle: string;
  highlight: boolean;
  popular: boolean;
}> = [
  {
    id: "starter",
    title: "Starter",
    description: "Para profissionais que querem mais visibilidade.",
    features: [
      "Até 5 trabalhos simultâneos",
      "Selo Starter no perfil",
      "Selo de verificado no perfil",
      "Prioridade acima do plano gratuito",
      "Suporte tecnico",
      "Gerenciamento pelo portal Stripe",
      "Taxa da plataforma: 10%",
    ],
    buttonText: "Assinar Starter",
    buttonStyle: "bg-[#d73cbe] text-white shadow-lg shadow-purple-900/20",
    highlight: false,
    popular: true,
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Para quem quer dominar o mercado e escalar.",
    features: [
      "Até 10 trabalhos simultâneos",
      "Selo Advanced no perfil",
      "Selo de verificado no perfil",
      "Prioridade acima do Starter",
      "Suporte tecnico",
      "Gerenciamento pelo portal Stripe",
      "Taxa da plataforma: 10%",
    ],
    buttonText: "Assinar Advanced",
    buttonStyle:
      "bg-gradient-to-r from-violet-600 to-[#d73cbe] text-white shadow-lg shadow-purple-900/40",
    highlight: true,
    popular: false,
  },
];

type UpgradeBannerProps = {
  isPro: boolean;
  planLabel?: string;
  planPrices: TechPlanDisplayPrices;
  initialOpen?: boolean;
};

export function UpgradeBanner({
  isPro,
  planLabel = "Pro",
  planPrices,
  initialOpen = false,
}: UpgradeBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isSupportLoading, setIsSupportLoading] = useState(false);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (initialOpen && !isPro) {
      setIsOpen(true);
    }
  }, [initialOpen, isPro]);

  // Função para comprar (Checkout)
  const handleSubscribe = async (planId: string) => {
    setLoadingId(planId);
    try {
      const result = await createCheckoutSession(
        planId as "starter" | "advanced",
      );

      if (!result.success) {
        //Garantimos que sempre haverá um texto (fallback)
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

  const handleSupportSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSupportLoading(true);

    try {
      const result = await requestTechSupport({
        subject: supportSubject,
        message: supportMessage,
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao enviar suporte.");
        return;
      }

      toast.success("Solicitacao enviada ao suporte.");
      setSupportSubject("");
      setSupportMessage("");
      setIsSupportOpen(false);
    } catch {
      toast.error("Erro ao enviar suporte.");
    } finally {
      setIsSupportLoading(false);
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
                {planLabel}
              </span>
            </h2>
            <p className="text-emerald-200/70 text-sm mt-1 max-w-md">
              Sua assinatura esta ativa. Gerencie plano, forma de pagamento e
              cancelamento pelo portal Stripe.
            </p>
          </div>
        </div>

        {/* Lado Direito: Botão de Gerenciar */}
        <div className="relative z-10 flex w-full flex-col gap-3 md:w-auto md:flex-row">
          <button
            onClick={() => setIsSupportOpen(true)}
            className="w-full md:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-100 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LifeBuoy className="w-4 h-4" /> Suporte
          </button>
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

        {isSupportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <form
              onSubmit={handleSupportSubmit}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Suporte tecnico
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Descreva o problema para nossa equipe administrativa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSupportOpen(false)}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-300">
                    Assunto
                  </label>
                  <input
                    value={supportSubject}
                    onChange={(event) => setSupportSubject(event.target.value)}
                    maxLength={120}
                    placeholder="Ex: Erro ao enviar proposta"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-300">
                    Mensagem
                  </label>
                  <textarea
                    value={supportMessage}
                    onChange={(event) => setSupportMessage(event.target.value)}
                    maxLength={1200}
                    rows={5}
                    placeholder="Explique o que aconteceu e inclua o ID do projeto, se tiver."
                    className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSupportOpen(false)}
                  disabled={isSupportLoading}
                  className="flex-1 rounded-xl bg-slate-800 py-3 text-sm font-bold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSupportLoading}
                  className="flex-[2] rounded-xl bg-emerald-500 py-3 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isSupportLoading ? "Enviando..." : "Enviar suporte"}
                </button>
              </div>
            </form>
          </div>
        )}
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
            Profissionais assinantes ganham prioridade na busca, selo de plano,
            maior limite de trabalhos simultaneos e suporte tecnico.
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
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors z-20 cursor-alias"
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
                      {planPrices[plan.id].price}
                      <span className="text-sm text-slate-500 ml-1 font-normal">
                        {planPrices[plan.id].period}
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
                      className={`w-full py-4 rounded-xl font-bold text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
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
