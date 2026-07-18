"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CircleCheck,
  MessagesSquare,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const paths = [
  {
    id: "search",
    eyebrow: "Escolha direta",
    title: "Encontre e converse com um profissional",
    description:
      "Ideal para quem já sabe qual profissional procura e quer comparar perfis antes de iniciar uma conversa.",
    action: "Buscar profissionais",
    href: "/search",
    icon: Search,
    color: "blue",
    steps: ["Pesquise o serviço", "Compare os perfis", "Converse pelo chat"],
    previewTitle: "Encontre o perfil certo",
    previewText: "Busca por especialidade, localização e experiência.",
  },
  {
    id: "project",
    eyebrow: "Receba propostas",
    title: "Publique sua necessidade uma única vez",
    description:
      "Explique o que precisa e permita que profissionais interessados enviem propostas com valor e prazo.",
    action: "Publicar um projeto",
    href: "/dashboard/cliente?novoProjeto=1",
    icon: Send,
    color: "purple",
    steps: ["Descreva o projeto", "Receba propostas", "Escolha a melhor opção"],
    previewTitle: "Seu projeto atrai profissionais",
    previewText: "Compare propostas sem repetir a mesma explicação.",
  },
  {
    id: "online",
    eyebrow: "Dia e hora marcados",
    title: "Agende um atendimento online",
    description:
      "Para consultas, aulas e orientações com especialistas que possuem agenda disponível na plataforma.",
    action: "Agendar atendimento",
    href: "/agendar-consulta",
    icon: CalendarCheck2,
    color: "pink",
    steps: ["Escolha o especialista", "Selecione o horário", "Acesse o atendimento"],
    previewTitle: "Atendimento com hora marcada",
    previewText: "Perfil, agenda e pagamento no mesmo processo.",
  },
] as const;

type PathId = (typeof paths)[number]["id"];

const accentClasses = {
  blue: {
    icon: "border-blue-400/20 bg-blue-400/10 text-blue-400",
    active: "border-blue-400/40 bg-blue-400/10",
    button: "bg-blue-500 hover:bg-blue-400",
    glow: "bg-blue-500/15",
  },
  purple: {
    icon: "border-violet-400/20 bg-violet-400/10 text-violet-400",
    active: "border-violet-400/40 bg-violet-400/10",
    button: "bg-violet-500 hover:bg-violet-400",
    glow: "bg-violet-500/15",
  },
  pink: {
    icon: "border-[#d73cbe]/20 bg-[#d73cbe]/10 text-[#d73cbe]",
    active: "border-[#d73cbe]/40 bg-[#d73cbe]/10",
    button: "bg-[#d73cbe] hover:bg-[#c02aa8]",
    glow: "bg-[#d73cbe]/15",
  },
} as const;

export default function ContractPathsSection() {
  const [activeId, setActiveId] = useState<PathId>("search");
  const contentRef = useRef<HTMLDivElement>(null);
  const activePath = paths.find((path) => path.id === activeId) ?? paths[0];
  const accent = accentClasses[activePath.color];

  useGSAP(
    () => {
      if (!contentRef.current) return;
      gsap.fromTo(
        contentRef.current.children,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: "power2.out" },
      );
    },
    { dependencies: [activeId], scope: contentRef },
  );

  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-[#07101f] px-4 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mb-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d73cbe]">
            <Sparkles className="h-4 w-4" />
            Um ponto de partida para cada necessidade
          </div>
          <h2 className="font-futura text-2xl font-bold uppercase text-white sm:text-3xl md:text-4xl">
            Como você prefere contratar?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Comece pela busca, receba propostas ou escolha um horário. A MWC
            conduz você pelo caminho adequado.
          </p>
        </div>

        <div className="grid overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 shadow-2xl shadow-black/20 lg:grid-cols-[320px_1fr]">
          <div className="flex gap-2 overflow-x-auto border-b border-white/10 p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:border-b-0 lg:border-r lg:p-4">
            {paths.map((path, index) => {
              const Icon = path.icon;
              const isActive = path.id === activeId;
              const pathAccent = accentClasses[path.color];

              return (
                <button
                  key={path.id}
                  type="button"
                  onClick={() => setActiveId(path.id)}
                  aria-pressed={isActive}
                  className={`group min-w-[220px] rounded-lg border p-4 text-left transition-all lg:min-w-0 ${
                    isActive
                      ? pathAccent.active
                      : "border-transparent hover:border-white/10 hover:bg-white/[0.035]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-md border ${pathAccent.icon}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Caminho {index + 1}
                      </span>
                      <p className="mt-0.5 text-sm font-bold text-white">
                        {path.eyebrow}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="relative min-h-[500px] overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className={`absolute -right-24 -top-24 h-80 w-80 rounded-full blur-[100px] ${accent.glow}`} />
            <div ref={contentRef} className="relative z-10 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  {activePath.eyebrow}
                </span>
                <h3 className="mt-3 max-w-xl font-futura text-2xl font-bold uppercase leading-tight text-white sm:text-3xl">
                  {activePath.title}
                </h3>
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                  {activePath.description}
                </p>

                <ol className="mt-7 space-y-3">
                  {activePath.steps.map((step, index) => (
                    <li key={step} className="flex items-center gap-3 text-sm text-slate-300">
                      <CircleCheck className={`h-5 w-5 ${accent.icon.split(" ").at(-1)}`} />
                      <span className="text-slate-500">0{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>

                <Link
                  href={activePath.href}
                  className={`mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 ${accent.button}`}
                >
                  {activePath.action}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="relative mx-auto w-full max-w-sm">
                <div className="absolute -inset-3 rotate-3 rounded-xl border border-white/5 bg-white/[0.02]" />
                <div className="relative rounded-xl border border-white/10 bg-[#0b1425] p-5 shadow-2xl">
                  <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-400/60" />
                      <span className="h-2 w-2 rounded-full bg-amber-400/60" />
                      <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      MWC
                    </span>
                  </div>
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg border ${accent.icon}`}>
                    <activePath.icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-bold text-white">{activePath.previewTitle}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{activePath.previewText}</p>
                  <div className="mt-6 space-y-3">
                    {[78, 58, 68].map((width, index) => (
                      <div key={width} className="flex items-center gap-3 rounded-md border border-white/5 bg-white/[0.025] p-3">
                        <span className={`h-8 w-8 rounded-md ${index === 0 ? accent.glow : "bg-white/5"}`} />
                        <div className="flex-1 space-y-2">
                          <div className="h-2 rounded-full bg-white/10" style={{ width: `${width}%` }} />
                          <div className="h-1.5 w-2/5 rounded-full bg-white/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center gap-2 rounded-md border border-emerald-400/10 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-300">
                    <MessagesSquare className="h-4 w-4" />
                    Acompanhe tudo pela plataforma
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
