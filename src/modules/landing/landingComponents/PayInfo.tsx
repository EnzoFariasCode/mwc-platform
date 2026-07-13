"use client";

import { useRef } from "react";
import { ShieldCheck, CreditCard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import cardFlagsImg from "@/assets/images/landingPage/payments.png";
import type { CustomerPaymentMethodInfo } from "@/modules/stripe/lib/payment-methods";

gsap.registerPlugin(ScrollTrigger);

function PayInfo({
  paymentMethods,
}: {
  paymentMethods: readonly CustomerPaymentMethodInfo[];
}) {
  const containerRef = useRef<HTMLElement>(null);
  const primaryPaymentMethod = paymentMethods[0];

  useGSAP(
    () => {
      // 1. Entrada dos Cards (Stagger Vertical)
      gsap.fromTo(
        ".gsap-pay-card",
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          },
        },
      );

      // 2. Ícones Flutuando (Animação Contínua em Loop)
      gsap.to(".gsap-icon-float", {
        y: -10, // Sobe 10px
        duration: 2,
        repeat: -1, // Infinito
        yoyo: true, // Vai e volta
        ease: "sine.inOut", // Movimento de onda suave
      });
    },
    { scope: containerRef },
  );

  return (
    <section
      id="formas-pagamento"
      ref={containerRef}
      className="relative border-b border-white/5 bg-slate-950 px-4 py-16 overflow-hidden lg:py-20"
    >
      {/* Background Decorativo */}
      <div className="absolute left-0 bottom-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* CARD 1: Formas de Pagamento */}
        <div className="gsap-pay-card opacity-0 border border-white/10 bg-white/5 backdrop-blur-md rounded-lg p-8 lg:p-10 flex flex-col items-start justify-center gap-6 hover:border-purple-500/30 transition-all duration-300 group">
          <div className="gsap-icon-float w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <CreditCard className="w-6 h-6 text-purple-400" />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold font-futura uppercase tracking-tight text-white leading-tight">
            Pagamento com <br />
            <span className="text-[#d73cbe]">
              {primaryPaymentMethod
                ? primaryPaymentMethod.label.toLowerCase()
                : "metodos exibidos pela Stripe"}
            </span>
          </h2>

          <p className="text-slate-300 text-base leading-relaxed">
            {primaryPaymentMethod
              ? "Facilidade para quem contrata e segurança para quem recebe. Os cartões compatíveis são apresentados no checkout da Stripe."
              : "Os métodos disponíveis são confirmados e apresentados diretamente no checkout da Stripe."}
          </p>

          <div className="flex flex-col gap-4 my-4 w-full">
            <div className="flex flex-wrap gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2.5"
                >
                  <CreditCard className="h-5 w-5 text-slate-300" />
                  <span className="text-sm text-slate-300">
                    {method.label}
                  </span>
                </div>
              ))}
            </div>

            {primaryPaymentMethod?.id === "card" && (
              <div className="mt-2 w-full flex items-center justify-start opacity-60">
                <Image
                  src={cardFlagsImg}
                  alt="Cartoes processados pela Stripe"
                  className="h-16 w-auto object-contain"
                  placeholder="blur"
                />
              </div>
            )}
          </div>

          {/* LINK ATUALIZADO AQUI */}
          <Link href="/beWorker#planos">
            <button className="bg-[#d73cbe] hover:bg-[#b0269a] cursor-pointer text-white px-8 py-3.5 rounded-lg font-bold transition-all shadow-lg shadow-purple-500/20 hover:translate-x-1">
              Ver Planos
            </button>
          </Link>
        </div>

        {/* CARD 2: Segurança */}
        <div className="gsap-pay-card opacity-0 border border-white/10 bg-gradient-to-br from-white/5 to-purple-900/10 backdrop-blur-md rounded-lg p-8 lg:p-10 flex flex-col items-center text-center justify-center gap-6 hover:border-blue-500/30 transition-all duration-300 group">
          <div className="gsap-icon-float w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform duration-500">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold font-futura uppercase tracking-tight text-white leading-tight">
            Segurança em <br />
            <span className="text-blue-400">Primeiro Lugar</span>
          </h2>

          <p className="text-slate-300 text-base leading-relaxed">
            O pagamento é protegido e mediado pela MWC. O saldo é liberado ao
            profissional após a aprovação da entrega, conforme as regras do
            serviço.
            <br />
            <br />
            <span className="text-white font-medium">
              Algo saiu errado?
            </span>{" "}
            A plataforma analisa cancelamentos e disputas conforme os termos.
            Disputas e chargebacks podem suspender ou reverter valores.
          </p>
        </div>
      </div>
    </section>
  );
}

export default PayInfo;
