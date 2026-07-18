"use client";

import { useRef } from "react";
import {
  BadgeCheck,
  FileCheck2,
  FileText,
  MessageCircleMore,
  Scale,
  WalletCards,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const protectionSteps = [
  {
    title: "Conversa dentro da MWC",
    description:
      "Alinhe escopo, prazo e detalhes pelo chat interno, mantendo o histórico da negociação em um só lugar.",
    icon: MessageCircleMore,
  },
  {
    title: "Proposta registrada",
    description:
      "Compare condições e aceite uma proposta com valor e prazo definidos antes de iniciar o trabalho.",
    icon: FileText,
  },
  {
    title: "Pagamento protegido",
    description:
      "O pagamento é processado pela plataforma e permanece protegido durante a execução do serviço.",
    icon: WalletCards,
  },
  {
    title: "Entrega para análise",
    description:
      "O profissional envia a entrega pela MWC para que você confira o resultado e acompanhe o andamento.",
    icon: FileCheck2,
  },
  {
    title: "Aprovação ou revisão",
    description:
      "Você pode aprovar a entrega ou solicitar uma revisão conforme as condições combinadas no projeto.",
    icon: BadgeCheck,
  },
  {
    title: "Mediação de disputas",
    description:
      "Se houver um desacordo, a MWC preserva os registros e analisa a disputa antes da destinação do valor.",
    icon: Scale,
  },
];

export function Fluxo() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".gsap-protection-heading",
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
        },
      );

      gsap.fromTo(
        ".gsap-protection-card",
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-protection-grid",
            start: "top 80%",
          },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden border-b border-white/5 bg-[#07101f] px-4 py-16 lg:py-20"
    >
      <div className="absolute left-1/2 top-1/2 -z-10 h-[560px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-900/10 blur-[130px]" />

      <div className="mx-auto max-w-6xl">
        <div className="gsap-protection-heading mx-auto mb-12 max-w-3xl text-center opacity-0">
          <h2 className="font-futura text-2xl font-bold uppercase leading-tight text-white sm:text-3xl md:text-4xl">
            Sua contratação protegida
            <span className="block text-[#d73cbe]">do acordo à entrega</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            A MWC registra as etapas importantes da negociação para dar mais
            clareza ao cliente e ao profissional durante todo o projeto.
          </p>
        </div>

        <div className="gsap-protection-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {protectionSteps.map((step, index) => (
            <article
              key={step.title}
              className="gsap-protection-card group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.035] p-6 opacity-0 transition-colors hover:border-[#d73cbe]/35 hover:bg-white/[0.055]"
            >
              <span className="absolute right-5 top-4 font-futura text-4xl font-bold text-white/[0.035]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[#d73cbe]/20 bg-[#d73cbe]/10 text-[#d73cbe] transition-transform group-hover:-translate-y-1">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-bold text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {step.description}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
          A liberação ou reversão de valores segue o status do projeto e as
          regras previstas nos termos da plataforma.
        </p>
      </div>
    </section>
  );
}
