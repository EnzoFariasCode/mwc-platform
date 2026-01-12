"use client";

import { PageContainer } from "@/components/dashboard/PageContainer";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Briefcase,
  Star,
  ShieldCheck,
  Share2,
  Flag,
  Send,
  ExternalLink, // Usado nos links de anexo
  Calendar, // <--- ADICIONADO: Usado em "Membro desde"
} from "lucide-react";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface ProjectDetailsProps {
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    budgetType: string;
    budgetLabel: string;
    deadline: string;
    createdAt: Date;
    attachments: any; // Permite qualquer formato de anexo (array de strings)
    owner: {
      name: string | null;
      city: string | null;
      state: string | null;
      rating: number | null;
      createdAt: Date;
    };
  };
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function ProjectDetailsView({ project }: ProjectDetailsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".animate-item",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }
      );
    },
    { scope: containerRef }
  );

  return (
    <PageContainer>
      <div ref={containerRef} className="max-w-5xl mx-auto space-y-6">
        {/* Botão Voltar */}
        <Link
          href="/dashboard/encontrar-projetos"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 animate-item"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para a busca
        </Link>

        {/* CABEÇALHO DO PROJETO */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 animate-item relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#d73cbe]" />

          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-bold text-slate-300 border border-white/10 uppercase tracking-wide">
                  {project.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" /> Publicado em{" "}
                  {formatDate(project.createdAt)}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-white font-futura leading-tight">
                {project.title}
              </h1>

              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-md bg-[#d73cbe]/10 text-[#d73cbe] text-xs font-bold border border-[#d73cbe]/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Card de Orçamento (Desktop) */}
            <div className="hidden md:flex flex-col items-end justify-center min-w-[200px] border-l border-white/5 pl-8">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">
                Orçamento Estimado
              </p>
              <p className="text-2xl font-mono font-bold text-white mb-1">
                {project.budgetLabel}
              </p>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                {project.budgetType === "fixed" ? "Preço Fixo" : "Por Hora"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUNA ESQUERDA - DESCRIÇÃO */}
          <div className="lg:col-span-2 space-y-6 animate-item">
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#d73cbe]" /> Detalhes do
                Projeto
              </h3>

              <div className="prose prose-invert prose-slate max-w-none">
                <p className="text-slate-300 leading-relaxed whitespace-pre-line text-lg">
                  {project.description}
                </p>
              </div>

              {/* Seção de Anexos REAL */}
              <div className="mt-8 pt-8 border-t border-white/5">
                <h4 className="text-sm font-bold text-white mb-4">
                  Anexos do Cliente
                </h4>

                {/* Verifica se project.attachments existe e é um array */}
                {Array.isArray(project.attachments) &&
                project.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {project.attachments.map((link: any, idx: number) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-700 rounded-xl hover:border-[#d73cbe]/50 hover:bg-[#d73cbe]/5 transition-all group"
                      >
                        <div className="p-2 bg-slate-900 rounded-lg text-slate-400 group-hover:text-[#d73cbe]">
                          {/* Ícone Genérico de Link */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                        </div>
                        <div className="overflow-hidden flex-1">
                          <p className="text-xs text-slate-500 font-medium mb-0.5">
                            Link Externo
                          </p>
                          <p className="text-sm text-white truncate font-mono underline decoration-slate-700 group-hover:decoration-[#d73cbe]">
                            {link}
                          </p>
                        </div>
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-[#d73cbe]" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-700 rounded-xl bg-slate-950/50 flex items-center justify-center text-slate-500 text-sm">
                    Nenhum anexo adicionado.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA - SIDEBAR */}
          <div className="space-y-6 animate-item">
            {/* Card Mobile de Orçamento */}
            <div className="md:hidden bg-slate-900 border border-white/5 rounded-2xl p-6 text-center">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">
                Orçamento
              </p>
              <p className="text-3xl font-mono font-bold text-white mb-2">
                {project.budgetLabel}
              </p>
              <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                {project.budgetType === "fixed" ? "Preço Fixo" : "Por Hora"}
              </span>
            </div>

            {/* Botão de Ação Principal */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 sticky top-24">
              <button className="w-full py-4 bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 text-lg cursor-pointer">
                <Send className="w-5 h-5" /> Enviar Proposta
              </button>
              <p className="text-xs text-center text-slate-500 mt-3">
                Você gasta <strong>2 conexões</strong> para enviar essa
                proposta.
              </p>
            </div>

            {/* Informações do Cliente */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                Sobre o Cliente
              </h3>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white font-bold text-lg">
                  {project.owner.name
                    ? project.owner.name.charAt(0).toUpperCase()
                    : "C"}
                </div>
                <div>
                  <p className="text-white font-bold">
                    {project.owner.name || "Cliente Oculto"}
                  </p>
                  <div className="flex items-center gap-1 text-yellow-500 text-xs">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="font-bold">
                      {project.owner.rating?.toFixed(1) || "Novo"}
                    </span>
                    <span className="text-slate-500 ml-1">(0 avaliações)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Local
                  </span>
                  <span className="text-slate-300">
                    {project.owner.city
                      ? `${project.owner.city}, ${project.owner.state}`
                      : "Brasil"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Verificado
                  </span>
                  <span className="text-green-400 font-bold">Sim</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Membro desde
                  </span>
                  <span className="text-slate-300">
                    {new Date(project.owner.createdAt).getFullYear()}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações Secundárias */}
            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700">
                <Share2 className="w-4 h-4" /> Compartilhar
              </button>
              <button className="flex-1 py-3 bg-slate-800 hover:bg-red-900/20 hover:text-red-400 text-slate-300 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700 hover:border-red-900/30">
                <Flag className="w-4 h-4" /> Denunciar
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
