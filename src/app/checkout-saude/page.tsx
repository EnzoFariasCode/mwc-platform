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
  ArrowRight,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

import { createCheckoutSession } from "@/modules/health/actions/payment-actions";
import { getHealthProfessionalById } from "@/modules/health/services/professional-service";
import type { HealthProfessionalProfile } from "@/modules/health/types";

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
  const [professional, setProfessional] =
    useState<HealthProfessionalProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados dos inputs editáveis
  const [clientName, setClientName] = useState<string | null>(null);
  const [clientEmail, setClientEmail] = useState<string | null>(null);

  // Formatação de data (de YYYY-MM-DD para DD/MM/YYYY)
  const formattedDate = dateStr.includes("-")
    ? dateStr.split("-").reverse().join("/")
    : dateStr;

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

    // Opcional: Aqui poderíamos passar o 'clientEmail' para o Stripe para enviar o recibo
    // const result = await createCheckoutSession(proId, dateStr, timeStr, clientEmail);
    const result = await createCheckoutSession(proId, dateStr, timeStr);

    if (result.error) {
      setError(result.error);
      setIsProcessing(false);
    } else if (result.url) {
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
      {/* 1. Reduzido o pt-28 excessivo para pt-24 e pb-24 */}
      <div className="min-h-screen bg-[#020617] text-white font-poppins pb-24 pt-24">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Margem inferior do header reduzida de mb-10 para mb-6 */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm bg-transparent border-none cursor-pointer"
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
              {/* 2. Reduzido de rounded-2xl para rounded-xl */}
              <div
                className={`bg-[#0f172a]/80 backdrop-blur-md border ${
                  step === 1
                    ? "border-[#d73cbe]/50"
                    : "border-white/10 opacity-70"
                } rounded-xl p-8`}
              >
                <h2 className="text-xl font-bold text-white mb-6">
                  Confirme seus dados
                </h2>
                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    {/* 3. Campos agora são Editáveis (Inputs controlados) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                        Nome Completo
                      </label>
                      <div className="flex items-center gap-3 bg-[#020617] p-3.5 rounded-lg border border-white/10 focus-within:border-[#d73cbe] transition-colors">
                        <User className="w-5 h-5 text-slate-500" />
                        <input
                          type="text"
                          value={clientName ?? session?.user?.name ?? ""}
                          onChange={(e) => setClientName(e.target.value)}
                          className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-600"
                          placeholder="Como deseja ser chamado?"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                        E-mail para recibo e acesso
                      </label>
                      <div className="flex items-center gap-3 bg-[#020617] p-3.5 rounded-lg border border-white/10 focus-within:border-[#d73cbe] transition-colors">
                        <Mail className="w-5 h-5 text-slate-500" />
                        <input
                          type="email"
                          value={clientEmail ?? session?.user?.email ?? ""}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-600"
                          placeholder="seu.email@exemplo.com"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end pt-4 border-t border-white/10">
                  <button
                    onClick={() => setStep(2)}
                    className="px-8 py-3 bg-[#d73cbe] hover:bg-[#b02da0] text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    Tudo certo, continuar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ETAPA 2: Pagamento */}
              <div
                className={`bg-[#0f172a]/80 backdrop-blur-md border ${
                  step === 2
                    ? "border-[#d73cbe]/50"
                    : "border-white/10 opacity-50"
                } rounded-xl p-8`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard
                    className={`w-6 h-6 ${
                      step === 2 ? "text-[#d73cbe]" : "text-slate-500"
                    }`}
                  />
                  <h2 className="text-xl font-bold text-white">
                    Pagamento Seguro
                  </h2>
                </div>
                {step === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Ao clicar em confirmar, você será redirecionado para o
                      checkout seguro do <strong>Stripe</strong> para finalizar
                      o agendamento.
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
              <div className="bg-[#0f172a] border border-white/10 rounded-xl p-8 sticky top-32">
                <h3 className="text-sm font-futura font-bold text-slate-400 uppercase tracking-widest mb-6 pb-4 border-b border-white/10">
                  Resumo do Agendamento
                </h3>

                <div className="flex gap-4 items-center mb-6">
                  {/* Adicionado bg-slate-800 para dar fundo ao avatar de iniciais se precisar */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-slate-800 flex items-center justify-center">
                    <Image
                      src={`/api/images/user/${professional.id}`}
                      /* FIX DO TYPESCRIPT: Fallback para string vazia ou texto padrão */
                      alt={professional.name || "Profissional"}
                      fill
                      className="object-cover"
                      unoptimized
                      /* Fallback para caso não tenha foto no banco, usa iniciais */
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(
                          professional.name || "P",
                        )}&color=fff&background=d73cbe`;
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm line-clamp-1">
                      {/* Tratando o null aqui também por segurança */}
                      {professional.name || "Profissional"}
                    </h4>
                    <p className="text-xs text-[#d73cbe] font-medium mt-0.5">
                      {professional.jobTitle || "Especialista"}
                    </p>
                  </div>
                </div>

                {/* 5. Resumo alterado de linha para Coluna elegante */}
                <div className="flex flex-col gap-3 mb-6 bg-white/5 rounded-lg p-5 border border-white/5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Data:</span>
                    <span className="font-bold text-white">
                      {formattedDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Horário:</span>
                    <span className="font-bold text-white">{timeStr}</span>
                  </div>
                  <div className="flex justify-between items-start mt-2 pt-3 border-t border-white/10">
                    <span className="text-slate-400">Especialidade:</span>
                    <span className="font-bold text-white text-right max-w-[140px] line-clamp-2">
                      {professional.jobTitle || "Consulta Online"}
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

                {/* 4. Botão com cursor-pointer dinâmico */}
                <button
                  onClick={handleCheckout}
                  disabled={step === 1 || isProcessing}
                  className={`w-full py-4 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    step === 2 && !isProcessing
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer shadow-lg shadow-emerald-900/20 active:scale-95"
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
