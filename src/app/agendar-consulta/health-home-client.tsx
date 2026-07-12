"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FileCheck2,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  UserRoundCheck,
  Video,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import FooterContact from "@/components/ui/FooterContact";
import type { HealthSpecialty } from "@/modules/health/lib/specialties";

gsap.registerPlugin(ScrollTrigger);

type HealthSpecialtyCard = HealthSpecialty & {
  count: number;
};

const bookingSteps = [
  {
    number: "01",
    title: "Escolha o especialista",
    description:
      "Conheca o perfil, a area de atuacao e as informacoes profissionais antes de decidir.",
    icon: UserRoundCheck,
  },
  {
    number: "02",
    title: "Veja agenda e valor",
    description:
      "Consulte os horarios disponiveis e saiba o valor do atendimento antes de confirmar.",
    icon: CalendarDays,
  },
  {
    number: "03",
    title: "Pague com seguranca",
    description:
      "Finalize o agendamento pelo checkout protegido e acompanhe a confirmacao no historico.",
    icon: CreditCard,
  },
  {
    number: "04",
    title: "Entre na videochamada",
    description:
      "Paciente e profissional recebem o acesso para entrar na mesma sala no horario marcado.",
    icon: Video,
  },
];

const trustPoints = [
  {
    title: "Registro profissional visivel",
    description:
      "Quando aplicavel, o perfil apresenta o tipo e o numero do registro informado pelo especialista.",
    icon: BadgeCheck,
  },
  {
    title: "Perfil antes do agendamento",
    description:
      "Formacao, apresentacao, especialidade, valor e disponibilidade ficam acessiveis para sua avaliacao.",
    icon: FileCheck2,
  },
  {
    title: "Historico centralizado",
    description:
      "Consultas, status, horarios e acesso ao atendimento permanecem organizados na area do paciente.",
    icon: CheckCircle2,
  },
];

const paymentPoints = [
  {
    title: "Checkout protegido",
    description:
      "O pagamento e processado pela Stripe e a consulta so e confirmada depois da aprovacao.",
    icon: LockKeyhole,
  },
  {
    title: "Politica de cancelamento",
    description:
      "Cancelamentos do paciente com mais de 24 horas de antecedencia geram reembolso integral.",
    icon: RefreshCcw,
  },
  {
    title: "Protecao contra imprevistos",
    description:
      "Se o profissional cancelar ou nao comparecer, o paciente tem direito ao reembolso integral.",
    icon: ShieldCheck,
  },
];

const faqItems = [
  {
    question: "Preciso criar uma conta antes de ver os profissionais?",
    answer:
      "Nao. Voce pode explorar especialidades, perfis, valores e informacoes publicas antes de entrar. A conta sera necessaria para concluir e acompanhar o agendamento.",
  },
  {
    question: "Como funciona o reembolso?",
    answer:
      "Cancelamentos feitos pelo paciente com mais de 24 horas de antecedencia recebem reembolso integral. Com menos de 24 horas, nao ha reembolso. Se o profissional cancelar ou nao comparecer, o reembolso e integral.",
  },
  {
    question: "A consulta e por video? Preciso instalar algo?",
    answer:
      "O atendimento usa um link de videochamada enviado aos participantes. Basta abrir o acesso no horario marcado em um navegador compativel.",
  },
  {
    question: "Onde encontro o link e os dados da consulta?",
    answer:
      "Depois da confirmacao do pagamento, o agendamento aparece em Minhas Consultas com data, horario, profissional e acesso ao atendimento.",
  },
  {
    question: "O pagamento e seguro?",
    answer:
      "O checkout e processado pela Stripe. A plataforma registra a confirmacao e mantem o fluxo de cancelamento, reembolso e disputa vinculado ao agendamento.",
  },
];

function formatSpecialistCount(count: number) {
  if (count === 0) return "Em breve";
  if (count === 1) return "1 especialista";
  return `${count} especialistas`;
}

export function HealthHomeClient({
  specialties,
}: {
  specialties: HealthSpecialtyCard[];
}) {
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".online-reveal-group").forEach((group) => {
        const items = group.querySelectorAll(".online-reveal");

        gsap.fromTo(
          items,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: group,
              start: "top 82%",
            },
          },
        );
      });
    },
    { scope: pageRef },
  );

  return (
    <div
      ref={pageRef}
      className="relative flex min-h-screen flex-col bg-[#020617] font-poppins text-white selection:bg-[#d73cbe]/30"
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-[500px] w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-[#d73cbe]/5 blur-[150px]" />
      </div>

      <main className="relative z-10 flex-grow">
        <section id="especialidades" className="container mx-auto max-w-6xl px-4 py-16">
          <div className="mb-16 flex max-w-3xl flex-col items-start text-left">
            <h1 className="mb-6 font-futura text-3xl font-bold uppercase leading-tight text-white">
              Encontre o especialista ideal para o seu{" "}
              <span className="bg-gradient-to-r from-[#d73cbe] to-purple-400 bg-clip-text text-transparent">
                atendimento online.
              </span>
            </h1>
            <p className="text-lg font-light leading-relaxed text-slate-400 md:text-sm">
              Agende consultorias, aulas e atendimentos online com especialistas
              que possuem perfil, agenda e valor configurados.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
            {specialties.map((spec) => (
              <Link
                key={spec.id}
                href={`/agendar-consulta/${spec.id}`}
                className="block outline-none"
              >
                <div
                  className={`group flex h-full cursor-pointer flex-col overflow-hidden rounded border border-white/10 bg-[#0f172a]/90 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 ${spec.color}`}
                >
                  <div className="relative h-[160px] w-full shrink-0 overflow-hidden bg-slate-900">
                    <Image
                      src={spec.image}
                      alt={spec.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-90" />
                  </div>

                  <div className="flex flex-grow flex-col p-4 lg:p-5">
                    <div>
                      <h2
                        className={`mb-2 font-futura text-lg font-bold uppercase tracking-wide transition-colors duration-300 lg:text-xl ${spec.accentText}`}
                      >
                        {spec.name}
                      </h2>
                      <p className="line-clamp-3 text-xs font-light leading-relaxed text-slate-400 lg:text-sm">
                        {spec.description}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex -space-x-2">
                          <div className="h-6 w-6 rounded-full border-2 border-[#0f172a] bg-slate-700" />
                          <div className="h-6 w-6 rounded-full border-2 border-[#0f172a] bg-slate-600" />
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0f172a] bg-slate-500">
                            <span className="text-[8px] font-bold">+</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500 lg:text-[10px]">
                          {formatSpecialistCount(spec.count)}
                        </span>
                      </div>
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 group-hover:border-transparent group-hover:text-white ${spec.accentBg}`}
                      >
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y border-white/5 bg-[#07101f] py-20 sm:py-24">
          <div className="online-reveal-group container mx-auto max-w-6xl px-5 sm:px-6">
            <div className="online-reveal mb-12 max-w-2xl opacity-0">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#d73cbe]">
                Como funciona
              </span>
              <h2 className="mt-4 font-futura text-2xl font-bold uppercase leading-tight text-white sm:text-3xl md:text-4xl">
                Do perfil a videochamada,
                <span className="block text-[#d73cbe]">um caminho simples</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                Voce sabe o que acontece em cada etapa antes de confirmar seu
                atendimento
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {bookingSteps.map((step) => (
                <article
                  key={step.number}
                  className="online-reveal group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.035] p-5 opacity-0 transition-all duration-300 hover:-translate-y-1 hover:border-[#d73cbe]/40 hover:bg-white/[0.06]"
                >
                  <div className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-[#d73cbe] to-purple-400 transition-transform duration-500 group-hover:scale-x-100" />
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#d73cbe]/10 text-[#d73cbe] transition-transform duration-300 group-hover:scale-105">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="font-futura text-xs font-bold text-slate-600">
                      {step.number}
                    </span>
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
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="online-reveal-group container mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
            <div className="online-reveal opacity-0">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                Escolha com clareza
              </span>
              <h2 className="mt-4 font-futura text-2xl font-bold uppercase leading-tight text-white sm:text-3xl md:text-4xl">
                Informacoes profissionais
                <span className="block text-emerald-400">antes de agendar</span>
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-slate-400 sm:text-base">
                A decisao acontece com base no perfil publicado pelo
                especialista, sem esconder as informacoes essenciais ate o
                checkout
              </p>
            </div>

            <div className="grid gap-4">
              {trustPoints.map((point) => (
                <article
                  key={point.title}
                  className="online-reveal group flex gap-4 rounded-lg border border-white/10 bg-[#0f172a]/70 p-5 opacity-0 transition-all duration-300 hover:border-emerald-400/35 hover:bg-[#111c30] sm:p-6"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-emerald-400/15 bg-emerald-400/10 text-emerald-400">
                    <point.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {point.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                      {point.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-[#07101f] py-20 sm:py-24">
          <div className="online-reveal-group container mx-auto max-w-6xl px-5 sm:px-6">
            <div className="online-reveal mb-12 flex flex-col gap-5 opacity-0 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                  Pagamento e protecao
                </span>
                <h2 className="mt-4 font-futura text-2xl font-bold uppercase leading-tight text-white sm:text-3xl md:text-4xl">
                  Regras claras para
                  <span className="block text-blue-400">cada atendimento</span>
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
                Pagamento, cancelamento e reembolso permanecem vinculados ao
                agendamento
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {paymentPoints.map((point) => (
                <article
                  key={point.title}
                  className="online-reveal group rounded-lg border border-white/10 bg-gradient-to-b from-white/[0.055] to-white/[0.025] p-6 opacity-0 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/35"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-400/10 text-blue-400">
                    <point.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-white">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {point.description}
                  </p>
                </article>
              ))}
            </div>

            <p className="online-reveal mt-5 text-xs leading-relaxed text-slate-500 opacity-0">
              Cancelamentos do paciente com menos de 24 horas de antecedencia
              nao geram reembolso. As regras completas sao apresentadas antes
              da confirmacao do pagamento.
            </p>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="online-reveal-group container mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div className="online-reveal opacity-0">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#d73cbe]">
                Duvidas frequentes
              </span>
              <h2 className="mt-4 font-futura text-2xl font-bold uppercase leading-tight text-white sm:text-3xl md:text-4xl">
                Antes de marcar,
                <span className="block text-[#d73cbe]">saiba como funciona</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
                Respostas diretas sobre conta, videochamada, pagamento e
                cancelamento
              </p>
            </div>

            <div className="space-y-3">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="online-reveal group rounded-lg border border-white/10 bg-white/[0.03] opacity-0 open:border-[#d73cbe]/30 open:bg-white/[0.05]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-bold text-white marker:content-none sm:p-6 sm:text-base">
                    {item.question}
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#d73cbe] transition-transform duration-300 group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400 sm:px-6 sm:pb-6">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 px-5 py-20 sm:px-6 sm:py-24">
          <div className="online-reveal-group relative mx-auto max-w-6xl overflow-hidden rounded-lg border border-[#d73cbe]/25 bg-[#0b1528] px-6 py-12 text-center sm:px-10 sm:py-16">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#d73cbe0d_1px,transparent_1px),linear-gradient(to_bottom,#d73cbe0d_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="online-reveal relative mx-auto max-w-2xl opacity-0">
              <h2 className="font-futura text-2xl font-bold uppercase leading-tight text-white sm:text-3xl md:text-4xl">
                Seu proximo atendimento
                <span className="block text-[#d73cbe]">pode comecar agora</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                Escolha uma especialidade, compare os perfis disponiveis e
                encontre o melhor horario para voce
              </p>
              <Link
                href="#especialidades"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#d73cbe] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#d73cbe]/20 transition-all hover:-translate-y-1 hover:bg-[#bd2fa7]"
              >
                Ver especialidades
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <FooterContact />
    </div>
  );
}
