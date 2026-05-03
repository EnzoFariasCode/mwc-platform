"use client";

import { use, useState, useEffect } from "react";
import { useSession } from "next-auth/react"; // Traz a sessão do NextAuth (Back-end)
import { useRouter } from "next/navigation"; // Controla o redirecionamento (Front-end/UX)
import { HealthHeader } from "@/modules/health/components/health-header";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  MapPin,
  Edit3,
  ArrowRight,
  Clock,
  ShieldCheck,
  CreditCard,
  Lock,
  CheckCircle2,
  Video,
} from "lucide-react";

// Mock do Profissional (Isso virá do banco depois puxando pelo proId)
const mockProfessional = {
  name: "Dr. Carlos Eduardo",
  title: "Psicólogo Clínico",
  image:
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=250&q=80",
  price: "R$ 150,00",
};

export default function CheckoutSaudePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = use(searchParams);
  const date = (resolvedParams.date as string) || "Data não selecionada";
  const time = (resolvedParams.time as string) || "--:--";
  const proId = (resolvedParams.proId as string) || "";

  // 1. INFRA & BACK-END: Puxa o status da autenticação do NextAuth
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados de controle do Front-end
  const [step, setStep] = useState<1 | 2>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 2. UX & SEGURANÇA: Redireciona caso não esteja logado, guardando a URL atual
  useEffect(() => {
    if (status === "unauthenticated") {
      // Monta a URL de volta com todos os parâmetros exatos que o usuário clicou
      const currentPath = `/checkout-saude?proId=${proId}&time=${time}&date=${date}`;
      const callbackUrl = encodeURIComponent(currentPath);

      // Manda para a página de login do projeto com a instrução de retorno
      router.push(`/login?callbackUrl=${callbackUrl}`);
    }
  }, [status, router, proId, time, date]);

  // Simula o processamento do pagamento via Stripe e geração do Meet
  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2000);
  };

  // 3. UI/UX: Tela de Loading suave enquanto verifica a sessão (evita piscar a tela)
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <ShieldCheck className="w-12 h-12 text-[#d73cbe]" />
          <p className="text-slate-400 font-futura tracking-widest uppercase text-sm">
            Preparando ambiente seguro...
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver logado, não renderiza nada (o useEffect já está redirecionando)
  if (status === "unauthenticated") return null;

  // Se for sucesso, renderiza a tela de confirmação
  if (isSuccess) {
    return (
      <>
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0f172a] border border-white/10 rounded-2xl p-8 text-center shadow-2xl shadow-[#d73cbe]/10 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-futura font-bold text-white mb-2 uppercase tracking-tight">
              Pagamento Aprovado
            </h2>
            <p className="text-slate-400 mb-8">
              Sua consulta com {mockProfessional.name} está confirmada.
            </p>

            <div className="bg-[#020617] border border-white/5 rounded-xl p-5 mb-8 text-left space-y-3">
              <div className="flex items-center gap-3 text-slate-300">
                <CalendarIcon className="w-5 h-5 text-[#d73cbe]" /> {date}
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Clock className="w-5 h-5 text-[#d73cbe]" /> {time}
              </div>
              <div className="flex items-start gap-3 pt-3 border-t border-white/5">
                <Video className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div>
                  <span className="block text-sm font-bold text-emerald-500">
                    Link do Google Meet gerado
                  </span>
                  <span className="text-xs text-slate-500">
                    Enviado para {session?.user?.email || "seu e-mail"}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/agendar-consulta/historico"
              className="w-full py-4 bg-[#d73cbe] hover:bg-[#b02da0] text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              Ir para Minhas Consultas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HealthHeader />
      <div className="min-h-screen bg-[#020617] text-white font-poppins pb-24 pt-28">
        <div className="container mx-auto max-w-6xl px-4">
          {/* HEADER DO CHECKOUT */}
          <div className="mb-10">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm cursor-pointer bg-transparent border-none"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <h1 className="text-3xl md:text-4xl font-futura font-bold text-white mb-2 uppercase tracking-tight">
              Finalize seu <span className="text-[#d73cbe]">Agendamento</span>
            </h1>
            <p className="text-slate-400 text-lg font-light">
              Siga os passos abaixo para garantir seu horário.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* COLUNA ESQUERDA: FLUXO DE PASSOS */}
            <div className="w-full lg:w-2/3 flex flex-col gap-6">
              {/* ETAPA 1: CONFIRMAÇÃO DE DADOS */}
              <div
                className={`bg-[#0f172a]/80 backdrop-blur-md border ${step === 1 ? "border-[#d73cbe]/50 shadow-[0_0_30px_rgba(215,60,190,0.1)]" : "border-white/10 opacity-70"} rounded-2xl p-6 md:p-8 transition-all duration-500`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Confirme seus dados
                    </h2>
                    <p className="text-sm text-slate-400">
                      Mantenha seus dados atualizados.
                    </p>
                  </div>
                  {step === 2 && (
                    <button
                      onClick={() => setStep(1)}
                      className="text-[#d73cbe] text-sm font-semibold hover:underline cursor-pointer"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {step === 1 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-4 rounded-xl">
                        <User className="w-5 h-5 text-slate-400" />
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                            Nome Completo
                          </span>
                          {/* DADOS REAIS DO USUÁRIO LOGADO */}
                          <span className="text-sm font-semibold capitalize">
                            {session?.user?.name || "Usuário não identificado"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-4 rounded-xl">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <div className="overflow-hidden">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                            E-mail
                          </span>
                          {/* DADOS REAIS DO USUÁRIO LOGADO */}
                          <span className="text-sm font-semibold truncate block max-w-[150px] md:max-w-[200px]">
                            {session?.user?.email || "email@naoencontrado.com"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-4 rounded-xl">
                        <Phone className="w-5 h-5 text-slate-400" />
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                            WhatsApp
                          </span>
                          <span className="text-sm font-semibold">
                            (11) 99999-9999
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-4 rounded-xl">
                        <CalendarIcon className="w-5 h-5 text-slate-400" />
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                            Nascimento & Sexo
                          </span>
                          <span className="text-sm font-semibold">
                            Preencha no perfil
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-between pt-4 border-t border-white/10">
                      <Link
                        href="/agendar-consulta/meu-perfil"
                        className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" /> Completar meus dados
                      </Link>
                      <button
                        onClick={() => setStep(2)}
                        className="w-full sm:w-auto px-8 py-3 bg-[#d73cbe] hover:bg-[#b02da0] text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#d73cbe]/20 cursor-pointer"
                      >
                        Tudo certo, continuar <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* ETAPA 2: PAGAMENTO */}
              <div
                className={`bg-[#0f172a]/80 backdrop-blur-md border ${step === 2 ? "border-[#d73cbe]/50 shadow-[0_0_30px_rgba(215,60,190,0.1)]" : "border-white/10 opacity-50"} rounded-2xl p-6 md:p-8 transition-all duration-500`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard
                    className={`w-6 h-6 ${step === 2 ? "text-[#d73cbe]" : "text-slate-500"}`}
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Pagamento
                    </h2>
                    <p className="text-sm text-slate-400">
                      Ambiente 100% seguro e criptografado.
                    </p>
                  </div>
                </div>

                {step === 1 ? (
                  <p className="text-sm text-slate-500 mt-4">
                    Confirme seus dados acima para liberar a forma de pagamento.
                  </p>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-[#020617] border border-white/10 rounded-xl p-4 space-y-4 relative overflow-hidden">
                      <div className="absolute top-4 right-4 flex gap-2 opacity-50">
                        <div className="w-8 h-5 bg-white/20 rounded"></div>
                        <div className="w-8 h-5 bg-white/20 rounded"></div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                          Número do Cartão
                        </label>
                        <input
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          className="w-full bg-transparent border-b border-white/10 pb-2 text-white placeholder-slate-600 focus:outline-none focus:border-[#d73cbe] transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                            Validade (MM/AA)
                          </label>
                          <input
                            type="text"
                            placeholder="MM/AA"
                            className="w-full bg-transparent border-b border-white/10 pb-2 text-white placeholder-slate-600 focus:outline-none focus:border-[#d73cbe] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                            CVC
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full bg-transparent border-b border-white/10 pb-2 text-white placeholder-slate-600 focus:outline-none focus:border-[#d73cbe] transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                          Nome no Cartão
                        </label>
                        <input
                          type="text"
                          placeholder="JOÃO DA SILVA"
                          className="w-full bg-transparent border-b border-white/10 pb-2 text-white placeholder-slate-600 focus:outline-none focus:border-[#d73cbe] transition-colors uppercase"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
                      <Lock className="w-3 h-3" /> Transação protegida via
                      Stripe
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* COLUNA DIREITA: RESUMO DA CONSULTA */}
            <div className="w-full lg:w-1/3">
              <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-white/10 rounded-2xl p-6 md:p-8 sticky top-32 shadow-2xl">
                <h3 className="text-lg font-futura font-bold text-white uppercase tracking-wide mb-6 border-b border-white/10 pb-4">
                  Resumo da Reserva
                </h3>

                <div className="flex gap-4 items-center mb-6">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                    <Image
                      src={mockProfessional.image}
                      alt="Doutor"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      {mockProfessional.name}{" "}
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    </h4>
                    <p className="text-xs text-[#d73cbe] font-medium">
                      {mockProfessional.title}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6 bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-400">
                      <CalendarIcon className="w-4 h-4" />{" "}
                      <span className="text-sm font-medium">Data</span>
                    </div>
                    <span className="text-sm font-bold text-white">{date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4" />{" "}
                      <span className="text-sm font-medium">Horário</span>
                    </div>
                    <span className="text-sm font-bold text-white">{time}</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-slate-400 font-medium">
                      Total a pagar
                    </span>
                    <span className="text-3xl font-futura font-bold text-white">
                      {mockProfessional.price}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={step === 1 || isProcessing}
                  className={`w-full py-4 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                    step === 2
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 cursor-pointer"
                      : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                  }`}
                >
                  {isProcessing ? (
                    "Processando..."
                  ) : (
                    <>
                      Confirmar Agendamento <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] text-slate-500 mt-4 leading-relaxed">
                  Ao prosseguir, você concorda com nossos Termos de Uso. O link
                  do Google Meet será gerado após o pagamento retido de forma
                  segura[cite: 1].
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
