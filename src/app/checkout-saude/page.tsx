"use client";

import { use, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HealthHeader } from "@/modules/health/components/health-header";
import Image from "next/image";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar as CalendarIcon,
  ArrowRight,
  Clock,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

// Trocamos createAppointment por createCheckoutSession
import { createCheckoutSession } from "@/modules/health/actions/payment-actions";
import { getHealthProfessionalById } from "@/modules/health/services/professional-service";

export default function CheckoutSaudePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = use(searchParams);
  const dateStr = (resolvedParams.date as string) || "";
  const timeStr = (resolvedParams.time as string) || "";
  const proId = (resolvedParams.proId as string) || "";

  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [professional, setProfessional] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (proId) {
      getHealthProfessionalById(proId).then((res) => {
        if (res) setProfessional(res);
      });
    }
  }, [proId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      const currentPath = `/checkout-saude?proId=${proId}&time=${timeStr}&date=${dateStr}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [status, router, proId, timeStr, dateStr]);

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);

    // 🛡️ MODO REAL: Gera sessão no Stripe
    const result = await createCheckoutSession(proId, dateStr, timeStr);

    if (result.error) {
      setError(result.error);
      setIsProcessing(false);
    } else if (result.url) {
      // Redireciona para o site oficial do Stripe
      window.location.href = result.url;
    }
  };

  if (status === "loading" || !professional) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <ShieldCheck className="w-12 h-12 text-[#d73cbe]" />
          <p className="text-slate-400 font-futura tracking-widest uppercase text-sm">
            Validando Agendamento...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <HealthHeader />
      <div className="min-h-screen bg-[#020617] text-white font-poppins pb-24 pt-28">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-10">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm bg-transparent border-none cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <h1 className="text-3xl md:text-4xl font-futura font-bold text-white mb-2 uppercase tracking-tight">
              Finalize seu <span className="text-[#d73cbe]">Agendamento</span>
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full lg:w-2/3 flex flex-col gap-6">
              {/* ETAPA 1: Dados */}
              <div
                className={`bg-[#0f172a]/80 backdrop-blur-md border ${step === 1 ? "border-[#d73cbe]/50" : "border-white/10 opacity-70"} rounded-2xl p-8`}
              >
                <h2 className="text-2xl font-bold text-white mb-6">
                  Confirme seus dados
                </h2>
                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                      <User className="w-5 h-5 text-slate-400" />
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">
                          Nome
                        </span>
                        <span className="text-sm font-semibold">
                          {session?.user?.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-slate-500 uppercase block">
                          E-mail
                        </span>
                        <span className="text-sm font-semibold truncate block">
                          {session?.user?.email}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end pt-4 border-t border-white/10">
                  <button
                    onClick={() => setStep(2)}
                    className="px-8 py-3 bg-[#d73cbe] hover:bg-[#b02da0] text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-all"
                  >
                    Tudo certo, continuar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ETAPA 2: Pagamento */}
              <div
                className={`bg-[#0f172a]/80 backdrop-blur-md border ${step === 2 ? "border-[#d73cbe]/50" : "border-white/10 opacity-50"} rounded-2xl p-8`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard
                    className={`w-6 h-6 ${step === 2 ? "text-[#d73cbe]" : "text-slate-500"}`}
                  />
                  <h2 className="text-2xl font-bold text-white">
                    Pagamento Seguro
                  </h2>
                </div>
                {step === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                      Ao clicar em confirmar, você será redirecionado para o
                      checkout seguro do <strong>Stripe</strong> para finalizar
                      o pagamento.
                    </p>
                    {error && (
                      <p className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        {error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RESUMO FIXO NA DIREITA */}
            <div className="w-full lg:w-1/3">
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-8 sticky top-32">
                <h3 className="text-lg font-futura font-bold text-white uppercase mb-6 pb-4 border-b border-white/10">
                  Resumo
                </h3>
                <div className="flex gap-4 items-center mb-6">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                    <Image
                      src={`/api/images/user/${professional.id}`}
                      alt="Doutor"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {professional.name}
                    </h4>
                    <p className="text-xs text-[#d73cbe] font-medium">
                      {professional.jobTitle}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6 bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Data/Hora</span>
                    <span className="font-bold text-white">
                      {dateStr} às {timeStr}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-slate-400">Total</span>
                    <span className="text-3xl font-futura font-bold text-white">
                      R${" "}
                      {Number(professional.consultationFee).toLocaleString(
                        "pt-BR",
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={step === 1 || isProcessing}
                  className={`w-full py-4 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    step === 2 && !isProcessing
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "bg-white/5 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {isProcessing ? "Redirecionando..." : "Pagar e Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
