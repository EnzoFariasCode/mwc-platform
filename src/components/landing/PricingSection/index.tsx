"use client";

import { useState } from "react";
import {
  Check,
  Loader2,
  Rocket,
  Zap,
  Settings,
  ArrowRight,
  AlertTriangle, // <-- Adicionado para o ícone do Modal
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
  userType?: "CLIENT" | "PROFESSIONAL" | "ADMIN" | null; // <-- NOVA PROP
}

export function PricingSection({
  userStatus,
  isLoggedIn,
  userType,
}: PricingSectionProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showClientModal, setShowClientModal] = useState(false); // <-- ESTADO DO MODAL
  const router = useRouter();

  const handleAction = async (planId: string) => {
    // 1. Checa se está logado
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // 2. Trava de Segurança: Se for CLIENTE, mostra o modal e para a execução
    if (userType === "CLIENT") {
      setShowClientModal(true);
      return;
    }

    setLoadingId(planId);

    // 3. Se for PROFISSIONAL ativo, manda pro portal
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

    // 4. Se for PROFISSIONAL inativo, manda pro checkout
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
    <>
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
            <div className="gsap-plan-card-premium bg-white/5 border border-white/10 p-8 rounded-3xl opacity-0">
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
                    ? router.push(userType === "CLIENT" ? "/dashboard/cliente" : "/dashboard/profissional")
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
                  <span className="cta-blur absolute inset-0 opacity-0 bg-white/20 backdrop-blur-sm pointer-events-none" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- MODAL DE AVISO PARA CLIENTES --- */}
      {showClientModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-yellow-500/20 rounded-full shrink-0">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-futura">Acesso Restrito</h3>
                <p className="text-slate-400 text-sm">Conta de Cliente Detectada</p>
              </div>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              Essa opção de assinatura é válida apenas para contas <strong>PROFISSIONAIS</strong>. 
              Para assinar, acesse o seu dashboard e altere a sua conta para profissional, preencha seu perfil e assine para começar a pegar trabalhos e receber pagamentos.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={() => setShowClientModal(false)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Entendi
              </button>
              <button 
                onClick={() => router.push("/dashboard/cliente")}
                className="px-6 py-3 rounded-xl text-sm font-bold bg-[#d73cbe] text-white hover:bg-[#b0269a] transition-colors shadow-lg cursor-pointer"
              >
                Ir para o Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}