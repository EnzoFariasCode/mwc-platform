"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Apple,
  ArrowRight,
  Brain,
  CalendarCheck,
  CreditCard,
  Dumbbell,
  Languages,
  Scale,
  ShieldCheck,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import medicoImg from "@/assets/images/landingPage/medico.jpg";

gsap.registerPlugin(ScrollTrigger);

const onlineAreas = [
  { label: "Psicologia", icon: Brain, color: "text-[#d73cbe]" },
  { label: "Nutricao", icon: Apple, color: "text-emerald-400" },
  { label: "Personal", icon: Dumbbell, color: "text-orange-400" },
  { label: "Professor", icon: Languages, color: "text-blue-400" },
  { label: "Advocacia", icon: Scale, color: "text-amber-400" },
];

const onlineFlow = [
  {
    title: "Perfil e agenda",
    description: "Compare especialistas com valor, registro e horarios.",
    icon: CalendarCheck,
  },
  {
    title: "Pagamento seguro",
    description: "Confirme seu atendimento no checkout protegido.",
    icon: CreditCard,
  },
  {
    title: "Atendimento online",
    description: "Acesse sua consulta, aula ou orientacao no horario marcado.",
    icon: ShieldCheck,
  },
];

export default function TelemedicinaSection() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".gsap-left-col",
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          },
        },
      );

      gsap.fromTo(
        ".gsap-list-item",
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.08,
          delay: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          },
        },
      );

      gsap.fromTo(
        ".gsap-card-visual",
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden border-b border-white/5 bg-slate-950 px-5 py-16 sm:px-8 lg:py-20"
    >
      <div className="absolute left-0 top-1/2 -z-10 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-purple-900/10 blur-[120px]" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="gsap-left-col opacity-0">
          <span className="inline-flex rounded-md border border-[#d73cbe]/20 bg-[#d73cbe]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[#d73cbe]">
            MWC Online
          </span>

          <h2 className="mt-5 max-w-xl font-futura text-2xl font-bold uppercase leading-tight text-white sm:text-3xl md:text-4xl">
            Especialistas online para
            <span className="block bg-gradient-to-r from-[#d73cbe] to-purple-500 bg-clip-text text-transparent">
              diferentes momentos
            </span>
          </h2>

          <p className="mt-6 max-w-lg text-sm leading-relaxed text-slate-400 sm:text-base">
            Encontre profissionais para consultas, aulas e orientacoes online,
            com perfil publico, agenda disponivel e pagamento seguro.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {onlineAreas.map((area) => (
              <li
                key={area.label}
                className="gsap-list-item flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300 opacity-0"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-slate-900">
                  <area.icon className={`h-4 w-4 ${area.color}`} />
                </span>
                {area.label}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/agendar-consulta">
              <button className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#d73cbe] px-8 py-4 text-base font-bold text-white shadow-lg shadow-purple-900/20 transition-all hover:-translate-y-1 hover:bg-[#b0269a] hover:shadow-purple-900/40 sm:w-auto">
                Encontrar especialista
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </div>

        <div className="relative space-y-4">
          <div className="gsap-card-visual relative h-[360px] overflow-hidden rounded-lg border border-white/10 opacity-0 shadow-2xl sm:h-[440px]">
            <Image
              src={medicoImg}
              alt="Especialista atendendo online"
              fill
              className="object-cover object-top"
              placeholder="blur"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

            <div className="absolute left-4 right-4 top-4 rounded-md border border-white/10 bg-slate-950/60 p-5 backdrop-blur-md sm:left-6 sm:right-auto sm:w-72">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#d73cbe]/20 text-[#d73cbe]">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Proximo horario
                  </p>
                  <p className="text-sm font-bold text-white">
                    Escolha na agenda do especialista
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <p className="max-w-md font-futura text-2xl font-bold leading-tight text-white">
                Da escolha do profissional ao atendimento, tudo no mesmo fluxo.
              </p>
              <p className="mt-2 max-w-md text-sm text-slate-300">
                O paciente agenda com clareza. O profissional recebe tudo no
                painel.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {onlineFlow.map((item) => (
              <div
                key={item.title}
                className="gsap-card-visual rounded-md border border-white/10 bg-white/[0.04] p-5 opacity-0"
              >
                <item.icon className="h-5 w-5 text-[#d73cbe]" />
                <h3 className="mt-3 text-sm font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
