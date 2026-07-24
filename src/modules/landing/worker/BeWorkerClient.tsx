"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileCheck2,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  UserRoundCheck,
  Video,
  Wallet,
  Zap,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import heroBg from "@/assets/images/howToBeWorker/hero-bg.jpg";
import dashboard from "@/assets/images/howToBeWorker/dashboard-mockup.png";
import { PricingSection } from "@/modules/landing/PricingSection";
import type { TechPlanDisplayPrices } from "@/modules/subscriptions/tech-plan-pricing";
import { resolveBeWorkerCta } from "./be-worker-cta";

gsap.registerPlugin(ScrollTrigger);

type Sector = "TECH" | "HEALTH";

const SvgButton = ({ text, href }: { text: string; href: string }) => (
  <div className="group relative inline-flex h-[60px] min-w-[240px]">
    <Link
      href={href}
      className="relative z-10 inline-flex h-full min-w-[240px] cursor-pointer items-center justify-center bg-transparent px-8 outline-none"
    >
      <svg
        viewBox="0 0 240 60"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full fill-none stroke-[#d73cbe] transition-all duration-1000 ease-in-out [stroke-dasharray:150_600] [stroke-dashoffset:150] group-hover:fill-[#d73cbe]/10 group-hover:[stroke-dashoffset:-600]"
      >
        <polyline points="239,1 239,59 1,59 1,1 239,1" strokeWidth="2" />
      </svg>
      <div className="pointer-events-none absolute inset-0 border border-white/20 transition-opacity duration-500 group-hover:opacity-0" />
      <span className="relative z-20 whitespace-nowrap text-base font-bold uppercase tracking-widest text-white">
        {text}
      </span>
    </Link>
  </div>
);

const techSteps = [
  {
    title: "Encontre projetos",
    description: "Acesse demandas publicadas por clientes e escolha onde atuar.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Envie sua proposta",
    description: "Defina valor, prazo e apresente sua experiencia ao cliente.",
    icon: MessageSquare,
  },
  {
    title: "Entregue o trabalho",
    description: "Centralize a conversa e acompanhe o projeto pelo painel.",
    icon: FileCheck2,
  },
  {
    title: "Receba na carteira",
    description:
      "Apos a aprovacao da entrega, o saldo e liberado na carteira. O saque cai na conta em ate 12 dias.",
    icon: Wallet,
  },
];

const onlineSteps = [
  {
    title: "Prepare seu perfil",
    description: "Apresente especialidade, experiencia e registro quando aplicavel.",
    icon: UserRoundCheck,
  },
  {
    title: "Configure sua agenda",
    description: "Defina disponibilidade, duracao e valor do atendimento.",
    icon: CalendarDays,
  },
  {
    title: "Atenda por video",
    description: "Paciente e profissional recebem acesso para a mesma sala online.",
    icon: Video,
  },
  {
    title: "Acompanhe seus ganhos",
    description: "Consultas e lancamentos ficam organizados no painel financeiro.",
    icon: CircleDollarSign,
  },
];

const commonResources = [
  {
    title: "Perfil profissional",
    description: "Mostre sua experiencia e construa uma presenca publica na plataforma.",
    icon: BadgeCheck,
  },
  {
    title: "Pagamento centralizado",
    description: "Contratacoes e atendimentos ficam vinculados ao fluxo financeiro.",
    icon: ShieldCheck,
  },
  {
    title: "Painel de trabalho",
    description: "Acompanhe atividades, historico e informacoes importantes em um so lugar.",
    icon: LayoutDashboard,
  },
  {
    title: "Historico financeiro",
    description: "Visualize valores, taxas, liberacoes e movimentacoes da sua conta.",
    icon: CreditCard,
  },
];

const faqItems = [
  {
    question: "Quanto a MWC cobra do profissional?",
    answer:
      "A taxa da plataforma e de 10% sobre os valores processados. No Marketplace Tech, os limites e beneficios tambem variam conforme o plano escolhido.",
  },
  {
    question: "Profissionais do MWC Online precisam assinar um plano?",
    answer:
      "Nao. Os planos Starter e Advanced sao exclusivos do Marketplace Tech. No MWC Online, a plataforma aplica a taxa de 10% a cada atendimento confirmado.",
  },
  {
    question: "Posso atuar no Tech e no Online com o mesmo cadastro?",
    answer:
      "Atualmente, cada conta profissional possui um setor principal: Marketplace Tech ou MWC Online. Escolha a modalidade que representa sua atividade principal no cadastro.",
  },
  {
    question: "Quando o valor fica disponivel para mim?",
    answer:
      "No Tech, o saldo e liberado na carteira depois que o cliente aprova a entrega. No Online, a liberacao segue a conclusao e as regras do atendimento. Disputas e chargebacks podem suspender ou reverter valores. Depois de solicitar o saque, o pagamento cai na conta em ate 12 dias.",
  },
  {
    question: "Quem pode atender pelo MWC Online?",
    answer:
      "Profissionais das especialidades disponiveis na plataforma, como Psicologia, Nutricao, Personal Trainer, ensino de Ingles e Advocacia. Registros profissionais devem ser informados quando aplicaveis.",
  },
];

interface BeWorkerClientProps {
  isLoggedIn: boolean;
  userStatus: "active" | "inactive" | null;
  userType?: "CLIENT" | "PROFESSIONAL" | "ADMIN" | null;
  industry?: Sector | null;
  planPrices: TechPlanDisplayPrices;
}

export default function BeWorkerClient({
  isLoggedIn,
  userStatus,
  userType,
  industry,
  planPrices,
}: BeWorkerClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const ctaContext = { isLoggedIn, userType, industry };
  const primaryCta = resolveBeWorkerCta(ctaContext, "primary");
  const techCta = resolveBeWorkerCta(ctaContext, "tech");
  const onlineCta = resolveBeWorkerCta(ctaContext, "online");

  useGSAP(
    () => {
      const timeline = gsap.timeline();
      timeline
        .fromTo(
          ".gsap-hero-title",
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
        )
        .fromTo(
          ".gsap-hero-text",
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
          "-=0.6",
        )
        .fromTo(
          ".gsap-hero-btn",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.2, ease: "power2.out" },
          "-=0.5",
        );

      gsap.utils.toArray<HTMLElement>(".worker-reveal-group").forEach((group) => {
        const items = group.querySelectorAll(".worker-reveal");
        gsap.fromTo(
          items,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.09,
            ease: "power3.out",
            scrollTrigger: { trigger: group, start: "top 82%" },
          },
        );
      });

      gsap.fromTo(
        ".gsap-plan-card-premium",
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: "#planos", start: "top 78%" },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className="overflow-x-hidden bg-slate-950 text-white">
      <section className="relative flex min-h-[620px] items-center overflow-hidden pb-16 pt-28 sm:min-h-[650px] sm:py-24 lg:py-32">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center-bottom bg-no-repeat opacity-60 lg:bg-fixed"
          style={{ backgroundImage: `url(${heroBg.src})` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/70" />
        <div className="container relative z-10 mx-auto flex flex-col items-center px-4 text-center">
          <h1 className="gsap-hero-title mb-6 font-futura text-3xl font-bold leading-tight text-white opacity-0 drop-shadow-2xl sm:text-4xl md:text-5xl lg:text-6xl">
            Transforme suas habilidades <br />
            <span className="bg-gradient-to-r from-[#d73cbe] to-violet-400 bg-clip-text text-transparent">
              em Renda Extra e Recorrente
            </span>
          </h1>
          <p className="gsap-hero-text mx-auto mb-10 max-w-2xl text-base font-medium leading-relaxed text-slate-200 opacity-0 drop-shadow-lg sm:mb-12 sm:text-lg md:text-xl">
            Voce foca no trabalho. O pagamento e protegido e mediado pela MWC,
            com liberacao conforme a conclusao de cada servico.
          </p>
          <div className="flex w-full max-w-sm flex-col items-center justify-center gap-6 sm:max-w-none sm:flex-row">
            <div className="gsap-hero-btn opacity-0">
              <SvgButton text={primaryCta.text} href={primaryCta.href} />
            </div>
            <div className="gsap-hero-btn opacity-0">
              <SvgButton text="Ver Processo" href="#como-funciona" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-[#07101f] py-16 lg:py-20">
        <div className="worker-reveal-group mx-auto grid max-w-6xl gap-4 px-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {commonResources.map((resource) => (
            <article
              key={resource.title}
              className="worker-reveal flex gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-5 opacity-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#d73cbe]/10 text-[#d73cbe]">
                <resource.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">{resource.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {resource.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="modalidades" className="border-b border-white/5 py-16 lg:py-20">
        <div className="worker-reveal-group mx-auto max-w-6xl px-5 sm:px-6">
          <div className="worker-reveal mx-auto mb-10 max-w-2xl text-center opacity-0 lg:mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#d73cbe]">
              Duas formas de atuar
            </span>
            <h2 className="mt-4 font-futura text-2xl font-bold uppercase text-white sm:text-3xl md:text-4xl">
              Escolha seu caminho profissional
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
              Cada setor possui seu proprio fluxo, painel e modelo de trabalho
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="worker-reveal group relative overflow-hidden rounded-lg border border-violet-400/20 bg-[#0d1628] p-6 opacity-0 transition-all hover:-translate-y-1 hover:border-violet-400/45 sm:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-violet-400/10 text-violet-400">
                <BriefcaseBusiness className="h-6 w-6" />
              </div>
              <span className="mt-6 block text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
                Marketplace Tech
              </span>
              <h3 className="mt-2 font-futura text-2xl font-bold uppercase text-white">
                Trabalhe com projetos
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
                Encontre demandas, envie propostas, negocie com clientes e
                entregue servicos de tecnologia, design e negocios
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-violet-400" /> Projetos e propostas</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-violet-400" /> Chat e entregas centralizados</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-violet-400" /> Pagamento protegido antes do inicio</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-violet-400" /> Planos para ampliar sua atuacao</li>
              </ul>
              <Link
                href={techCta.href}
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-violet-300 transition-colors hover:text-white"
              >
                {techCta.text} <ArrowRight className="h-4 w-4" />
              </Link>
            </article>

            <article className="worker-reveal group relative overflow-hidden rounded-lg border border-emerald-400/20 bg-[#0d1628] p-6 opacity-0 transition-all hover:-translate-y-1 hover:border-emerald-400/45 sm:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-400">
                <Video className="h-6 w-6" />
              </div>
              <span className="mt-6 block text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
                MWC Online
              </span>
              <h3 className="mt-2 font-futura text-2xl font-bold uppercase text-white">
                Atenda pela internet
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
                Ofereca consultas, aulas e orientacoes com perfil publico,
                agenda configurada e videochamada integrada
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Agenda e valor por atendimento</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Link de videochamada</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Sem assinatura mensal</li>
              </ul>
              <Link
                href={onlineCta.href}
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-emerald-300 transition-colors hover:text-white"
              >
                {onlineCta.text} <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section
        id="pagamento-protegido"
        className="border-b border-white/5 bg-[#07101f] py-16 lg:py-20"
      >
        <div className="worker-reveal-group mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div className="worker-reveal opacity-0">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              <ShieldCheck className="h-4 w-4" /> Pagamento protegido no Tech
            </span>
            <h2 className="mt-4 max-w-3xl font-futura text-2xl font-bold uppercase leading-tight text-white sm:text-3xl md:text-4xl">
              Comece o projeto sabendo que o pagamento ja foi realizado
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Depois que sua proposta e aceita, o cliente paga pela plataforma
              antes de o projeto entrar em execucao. O valor fica retido e
              mediado pela MWC ate a aprovacao da entrega, conforme as regras
              de cancelamento, disputa e chargeback.
            </p>
            <p className="mt-4 max-w-2xl border-l-2 border-emerald-400/60 pl-4 text-sm font-medium leading-relaxed text-emerald-100/90 sm:text-base">
              Mais seguranca para trabalhar e menos risco de concluir um
              projeto sem pagamento registrado.
            </p>
          </div>

          <div className="worker-reveal space-y-3 opacity-0">
            <div className="flex gap-4 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.045] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Valor registrado antes do trabalho
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  O projeto so avanca para execucao depois da confirmacao do
                  pagamento do cliente.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-violet-400/25 bg-violet-400/[0.055] p-5">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-400/10 text-violet-300">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Ganhe mais visibilidade com os planos pagos
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Starter aparece antes do Gratuito. Advanced recebe
                    prioridade maxima na busca de profissionais e nas
                    propostas enviadas.
                  </p>
                </div>
              </div>
              <Link
                href="#planos"
                className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300 transition-colors hover:text-white"
              >
                Comparar planos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-b border-white/5 bg-[#07101f] py-16 lg:py-20">
        <div className="worker-reveal-group mx-auto max-w-6xl px-5 sm:px-6">
          <div className="worker-reveal mb-10 max-w-2xl opacity-0 lg:mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#d73cbe]">
              Como funciona
            </span>
            <h2 className="mt-4 font-futura text-2xl font-bold uppercase text-white sm:text-3xl md:text-4xl">
              Um fluxo para cada modalidade
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <BriefcaseBusiness className="h-5 w-5 text-violet-400" />
                <h3 className="font-futura text-lg font-bold uppercase text-white">Marketplace Tech</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {techSteps.map((step, index) => (
                  <article key={step.title} className="worker-reveal rounded-lg border border-white/10 bg-white/[0.035] p-5 opacity-0">
                    <div className="flex items-center justify-between">
                      <step.icon className="h-5 w-5 text-violet-400" />
                      <span className="text-xs font-bold text-slate-600">0{index + 1}</span>
                    </div>
                    <h4 className="mt-4 text-sm font-bold text-white">{step.title}</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{step.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-3">
                <Video className="h-5 w-5 text-emerald-400" />
                <h3 className="font-futura text-lg font-bold uppercase text-white">MWC Online</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {onlineSteps.map((step, index) => (
                  <article key={step.title} className="worker-reveal rounded-lg border border-white/10 bg-white/[0.035] p-5 opacity-0">
                    <div className="flex items-center justify-between">
                      <step.icon className="h-5 w-5 text-emerald-400" />
                      <span className="text-xs font-bold text-slate-600">0{index + 1}</span>
                    </div>
                    <h4 className="mt-4 text-sm font-bold text-white">{step.title}</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{step.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 py-16 lg:py-20">
        <div className="worker-reveal-group mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:gap-14">
          <div className="worker-reveal opacity-0">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#d73cbe]">Seu espaco de trabalho</span>
            <h2 className="mt-4 font-futura text-2xl font-bold uppercase text-white sm:text-3xl md:text-4xl">
              Controle em um painel profissional
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-slate-400 sm:text-base">
              Cada setor possui ferramentas proprias para organizar sua rotina,
              acompanhar atividades e consultar seus dados financeiros
            </p>
            <ul className="mt-7 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-[#d73cbe]" /> Perfil e reputacao</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-[#d73cbe]" /> Historico financeiro</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-[#d73cbe]" /> Comunicacao centralizada</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-[#d73cbe]" /> Status em tempo real</li>
            </ul>
          </div>
          <div className="worker-reveal relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-slate-900 p-4 opacity-0">
            <div className="absolute inset-0 bg-[#d73cbe]/5" />
            <Image src={dashboard} alt="Painel profissional MWC" className="relative h-full w-full object-contain" placeholder="blur" />
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 bg-[#07101f] py-16 lg:py-20">
        <div className="worker-reveal-group mx-auto max-w-6xl px-5 sm:px-6">
          <div className="worker-reveal mb-10 max-w-2xl opacity-0 lg:mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Antes de comecar</span>
            <h2 className="mt-4 font-futura text-2xl font-bold uppercase text-white sm:text-3xl md:text-4xl">Prepare seu perfil profissional</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="worker-reveal rounded-lg border border-white/10 bg-white/[0.035] p-6 opacity-0">
              <FileCheck2 className="h-5 w-5 text-amber-400" />
              <h3 className="mt-4 text-base font-bold text-white">Dados profissionais</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">Informe sua area, experiencia e uma apresentacao clara sobre seu trabalho.</p>
            </article>
            <article className="worker-reveal rounded-lg border border-white/10 bg-white/[0.035] p-6 opacity-0">
              <BadgeCheck className="h-5 w-5 text-amber-400" />
              <h3 className="mt-4 text-base font-bold text-white">Registro quando aplicavel</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">Profissionais regulamentados devem apresentar o tipo e o numero do registro no perfil.</p>
            </article>
            <article className="worker-reveal rounded-lg border border-white/10 bg-white/[0.035] p-6 opacity-0">
              <Clock3 className="h-5 w-5 text-amber-400" />
              <h3 className="mt-4 text-base font-bold text-white">Disponibilidade real</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">Mantenha projetos ou agenda atualizados para oferecer uma experiencia confiavel.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 py-16 lg:py-20">
        <div className="worker-reveal-group mx-auto max-w-6xl px-5 sm:px-6">
          <div className="worker-reveal grid gap-6 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.045] p-6 opacity-0 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">MWC Online</span>
              <h2 className="mt-3 font-futura text-2xl font-bold uppercase text-white sm:text-3xl">Como voce recebe</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                Voce define o valor do atendimento. A MWC aplica uma taxa de 10%
                e os 90% restantes sao liberados na carteira conforme a
                conclusao e as regras da consulta. Depois da solicitacao de
                saque, o pagamento cai na sua conta em ate 12 dias
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
                <strong className="block text-2xl text-white">90%</strong>
                <span className="mt-1 block text-xs text-slate-400">para voce</span>
              </div>
              <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
                <strong className="block text-2xl text-emerald-400">R$ 0</strong>
                <span className="mt-1 block text-xs text-slate-400">mensalidade</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-white/5">
        <PricingSection
          isLoggedIn={isLoggedIn}
          userStatus={userStatus}
          userType={userType}
          industry={industry}
          planPrices={planPrices}
        />
      </div>

      <section className="border-b border-white/5 py-16 lg:py-20">
        <div className="worker-reveal-group mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
          <div className="worker-reveal opacity-0">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#d73cbe]">Duvidas profissionais</span>
            <h2 className="mt-4 font-futura text-2xl font-bold uppercase text-white sm:text-3xl md:text-4xl">Antes de entrar, saiba como funciona</h2>
          </div>
          <div className="space-y-3">
            {faqItems.map((item) => (
              <details key={item.question} className="worker-reveal group rounded-lg border border-white/10 bg-white/[0.03] opacity-0 open:border-[#d73cbe]/30 open:bg-white/[0.05]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-bold text-white marker:content-none sm:p-6 sm:text-base">
                  {item.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-[#d73cbe] transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400 sm:px-6 sm:pb-6">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6 lg:py-20">
        <div className="worker-reveal-group mx-auto max-w-6xl overflow-hidden rounded-lg border border-[#d73cbe]/25 bg-[#0b1528] px-6 py-12 text-center sm:px-10 sm:py-16">
          <div className="worker-reveal mx-auto max-w-3xl opacity-0">
            <h2 className="font-futura text-2xl font-bold uppercase text-white sm:text-3xl md:text-4xl">Escolha como deseja crescer com a MWC</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">Crie seu perfil profissional no setor que representa sua atividade principal</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={techCta.href} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-7 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:bg-violet-500">
                {techCta.text} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={onlineCta.href} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:bg-emerald-500">
                {onlineCta.text} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
