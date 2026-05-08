"use client";

import { use, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HealthHeader } from "@/modules/health/components/health-header";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Edit3,
  ArrowRight,
  Clock,
  ShieldCheck,
  CreditCard,
  Lock,
  CheckCircle2,
  Video,
} from "lucide-react";
import { createAppointment } from "@/modules/health/actions/appointment-actions";
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
  const [isSuccess, setIsSuccess] = useState(false);
  const [professional, setProfessional] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState("");

  // Carrega os dados reais do profissional ao entrar
  useEffect(() => {
    if (proId) {
      getHealthProfessionalById(proId).then((res) => {
        if (res) setProfessional(res);
      });
    }
  }, [proId]);

  // Segurança: Redirecionamento de Auth
  useEffect(() => {
    if (status === "unauthenticated") {
      const currentPath = `/checkout-saude?proId=${proId}&time=${timeStr}&date=${dateStr}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [status, router, proId, timeStr, dateStr]);

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);

    const result = await createAppointment({
      proId,
      date: dateStr,
      time: timeStr,
    });

    if (result.error) {
      setError(result.error);
      setIsProcessing(false);
    } else {
      setMeetLink(result.meetLink || "");
      setIsProcessing(false);
      setIsSuccess(true);
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0f172a] border border-white/10 rounded-2xl p-8 text-center shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-futura font-bold text-white mb-2 uppercase tracking-tight">
            Agendado!
          </h2>
          <p className="text-slate-400 mb-8">
            Sua consulta com {professional.name} está gravada no sistema.
          </p>

          <div className="bg-[#020617] border border-white/5 rounded-xl p-5 mb-8 text-left space-y-3">
            <div className="flex items-center gap-3 text-slate-300">
              <CalendarIcon className="w-5 h-5 text-[#d73cbe]" /> {dateStr}
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Clock className="w-5 h-5 text-[#d73cbe]" /> {timeStr}
            </div>
            <div className="flex items-start gap-3 pt-3 border-t border-white/5">
              <Video className="w-5 h-5 text-emerald-500 mt-0.5" />
              <div>
                <span className="block text-sm font-bold text-emerald-500">
                  Link da Teleconsulta
                </span>
                <span className="text-[10px] text-slate-500 break-all">
                  {meetLink}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/agendar-consulta/historico"
            className="w-full py-4 bg-[#d73cbe] hover:bg-[#b02da0] text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            Ver minhas consultas <ArrowRight className="w-4 h-4" />
          </Link>
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
              {/* ETAPA 1 */}
              <div
                className={`bg-[#0f172a]/80 backdrop-blur-md border ${step === 1 ? "border-[#d73cbe]/50 shadow-[0_0_30px_rgba(215,60,190,0.1)]" : "border-white/10 opacity-70"} rounded-2xl p-6 md:p-8 transition-all duration-500`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Confirme seus dados
                  </h2>
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
                          <span className="text-[10px] text-slate-500 uppercase block">
                            Nome Completo
                          </span>
                          <span className="text-sm font-semibold">
                            {session?.user?.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-4 rounded-xl">
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
                    <div className="flex justify-end pt-4 border-t border-white/10">
                      <button
                        onClick={() => setStep(2)}
                        className="px-8 py-3 bg-[#d73cbe] hover:bg-[#b02da0] text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-all"
                      >
                        Tudo certo, continuar <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* ETAPA 2 */}
              <div
                className={`bg-[#0f172a]/80 backdrop-blur-md border ${step === 2 ? "border-[#d73cbe]/50 shadow-[0_0_30px_rgba(215,60,190,0.1)]" : "border-white/10 opacity-50"} rounded-2xl p-6 md:p-8 transition-all duration-500`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard
                    className={`w-6 h-6 ${step === 2 ? "text-[#d73cbe]" : "text-slate-500"}`}
                  />
                  <h2 className="text-2xl font-bold text-white">Pagamento</h2>
                </div>
                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <p className="text-sm text-slate-400 mb-4">
                      No MVP atual, clique abaixo para simular o agendamento
                      real no banco.
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

            {/* RESUMO */}
            <div className="w-full lg:w-1/3">
              <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-white/10 rounded-2xl p-6 md:p-8 sticky top-32 shadow-2xl">
                <h3 className="text-lg font-futura font-bold text-white uppercase tracking-wide mb-6 border-b border-white/10 pb-4">
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
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Data</span>
                    <span className="font-bold text-white">{dateStr}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Horário</span>
                    <span className="font-bold text-white">{timeStr}</span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-6 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-slate-400">Total</span>
                    <span className="text-3xl font-futura font-bold text-white">
                      R$ {professional.consultationFee?.toString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={step === 1 || isProcessing}
                  className={`w-full py-4 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    step === 2 && !isProcessing
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                      : "bg-white/5 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {isProcessing ? "Processando..." : "Confirmar Agendamento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
