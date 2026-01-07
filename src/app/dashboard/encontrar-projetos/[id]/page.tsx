"use client";

import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Star,
  CheckCircle2,
  Share2,
  Flag,
  Paperclip,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// --- DADOS MOCKADOS (Simulando o que viria do Banco de Dados pelo ID) ---
const PROJECT_DETAILS = {
  id: "1",
  title: "Desenvolvimento de App Flutter para Delivery de Açaí",
  description: `
    Olá, estou procurando um desenvolvedor Fullstack experiente em Flutter para criar um aplicativo de delivery para minha loja de açaí.
    
    O aplicativo precisa ter:
    - Tela de Login/Cadastro (Social Login)
    - Cardápio interativo com adicionais
    - Carrinho de compras
    - Integração com Gateway de Pagamento (Mercado Pago ou Stripe)
    - Rastreamento do pedido em tempo real (Mapas)
    - Painel administrativo web para receber os pedidos.

    Já tenho o design básico no Figma, mas aceito sugestões de melhoria na UX.
    Preciso de alguém que tenha disponibilidade para reuniões semanais de alinhamento.
  `,
  category: "TI e Programação",
  tags: ["Flutter", "Mobile", "Firebase", "API Rest", "Google Maps"],
  budget: { type: "fixed", value: "R$ 3.000 - 5.000" },
  deadline: "Urgente", // "Urgente" ou data
  publishedAt: "Publicado há 2 horas",
  attachments: [
    { name: "Escopo_do_Projeto.pdf", size: "2.4 MB" },
    { name: "Layout_Inicial.png", size: "4.1 MB" },
  ],
  client: {
    name: "Marcos Oliveira",
    location: "São Paulo, SP",
    rating: 4.9,
    projectsPosted: 12,
    totalSpent: "R$ 15k+",
    memberSince: "Jan 2024",
    verified: true,
  },
};

export default function ProjectDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Animação de Entrada Suave
  useGSAP(
    () => {
      const tl = gsap.timeline();

      tl.fromTo(
        ".gsap-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
      );

      tl.fromTo(
        ".gsap-content",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" },
        "-=0.3"
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-6">
      {/* 1. Navegação (Breadcrumb) */}
      <div className="gsap-header flex items-center justify-between">
        <Link
          href="/dashboard/encontrar-projetos"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a busca
        </Link>
        <div className="flex gap-2">
          <button
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Compartilhar"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Denunciar"
          >
            <Flag className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- COLUNA ESQUERDA: DETALHES DO PROJETO --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Principal */}
          <div className="gsap-content bg-slate-900 border border-white/5 rounded-2xl p-6 md:p-8">
            {/* Cabeçalho do Card */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white font-futura mb-2 leading-tight">
                  {PROJECT_DETAILS.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" />{" "}
                    {PROJECT_DETAILS.publishedAt}
                  </span>
                  <span className="bg-slate-800 px-3 py-1 rounded-full">
                    {PROJECT_DETAILS.category}
                  </span>
                  {PROJECT_DETAILS.deadline === "Urgente" && (
                    <span className="flex items-center gap-1 text-red-400 font-bold bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                      <Zap className="w-3.5 h-3.5 fill-current" /> URGENTE
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-white/5 my-6" />

            {/* Descrição */}
            <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-line">
              {PROJECT_DETAILS.description}
            </div>

            <div className="h-px bg-white/5 my-8" />

            {/* Habilidades (Tags) */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                Habilidades Necessárias
              </h3>
              <div className="flex flex-wrap gap-2">
                {PROJECT_DETAILS.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium border border-white/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Anexos */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                Anexos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROJECT_DETAILS.attachments.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:border-[#d73cbe]/30 transition-colors cursor-pointer group"
                  >
                    <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-[#d73cbe]/10 group-hover:text-[#d73cbe] transition-colors">
                      <Paperclip className="w-5 h-5 text-slate-400 group-hover:text-[#d73cbe]" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm text-white truncate font-medium">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">{file.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- COLUNA DIREITA: SIDEBAR DO PROJETO --- */}
        <div className="gsap-content space-y-6">
          {/* Card de Ação (Orçamento) */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 sticky top-8">
            <div className="mb-6">
              <p className="text-slate-400 text-sm font-medium mb-1">
                Orçamento Estimado
              </p>
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-[#d73cbe]" />
                <span className="text-2xl font-bold text-white font-mono">
                  {PROJECT_DETAILS.budget.value}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 uppercase">
                {PROJECT_DETAILS.budget.type === "fixed"
                  ? "Preço Fixo"
                  : "Por Hora"}
              </p>
            </div>

            <button className="w-full py-4 rounded-xl bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold text-lg shadow-lg shadow-purple-900/20 transition-all hover:-translate-y-1 mb-3 cursor-pointer">
              Enviar Proposta
            </button>
            <button className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all border border-white/5 cursor-pointer">
              Salvar Projeto
            </button>

            {/* Info de Connects (Moedas) */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-[#d73cbe]" />
              <span>
                Requer <strong>4 Connects</strong> para enviar
              </span>
            </div>
          </div>

          {/* Card do Cliente */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Sobre o Cliente
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {PROJECT_DETAILS.client.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-white">
                  {PROJECT_DETAILS.client.name}
                </p>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="w-3 h-3" />{" "}
                  {PROJECT_DETAILS.client.location}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Avaliação</span>
                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                  <Star className="w-4 h-4 fill-current" />{" "}
                  {PROJECT_DETAILS.client.rating}
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Verificado</span>
                {PROJECT_DETAILS.client.verified ? (
                  <span className="flex items-center gap-1 text-green-400 font-bold">
                    <ShieldCheck className="w-4 h-4" /> Sim
                  </span>
                ) : (
                  <span className="text-slate-500">Não</span>
                )}
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Projetos Postados</span>
                <span className="text-white font-bold">
                  {PROJECT_DETAILS.client.projectsPosted}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Membro desde</span>
                <span className="text-white">
                  {PROJECT_DETAILS.client.memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* Aviso de Segurança */}
          <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-blue-400 font-bold text-sm mb-1">
                  Pagamento Garantido
                </h4>
                <p className="text-xs text-blue-200/60 leading-relaxed">
                  Seu pagamento fica retido conosco e só é liberado após a
                  entrega do projeto. Nunca aceite pagamentos por fora.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
