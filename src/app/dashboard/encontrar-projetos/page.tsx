"use client";

import { useState, useRef } from "react";
import {
  Search,
  MapPin,
  Clock,
  DollarSign,
  Filter,
  Star,
  Heart,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// --- MOCK DATA (Dados Fictícios para visualização) ---
const PROJECTS = [
  {
    id: 1,
    title: "Desenvolvimento de App Flutter para Delivery de Açaí",
    description:
      "Preciso de um desenvolvedor experiente em Flutter para criar um aplicativo de delivery completo. O app deve ter integração com mapas, gateway de pagamento e painel administrativo web...",
    tags: ["Flutter", "Mobile", "Firebase", "API Rest"],
    budget: "R$ 3.000 - 5.000",
    published: "há 2 horas",
    bids: 5,
    client: { location: "Brasil", rating: 4.8 },
  },
  {
    id: 2,
    title: "Redesign de Landing Page com foco em Conversão",
    description:
      "Estamos buscando um UI/UX Designer para reformular nossa landing page de vendas de infoprodutos. O objetivo é aumentar a conversão. Necessário entregar o figma editável.",
    tags: ["Figma", "UI/UX", "Landing Page", "Copywriting"],
    budget: "R$ 800 - 1.500",
    published: "há 45 minutos",
    bids: 12,
    client: { location: "Brasil", rating: 5.0 },
  },
  {
    id: 3,
    title: "Automação de Planilhas e Integração com WhatsApp",
    description:
      "Tenho uma planilha de leads e preciso que, ao preencher uma linha, uma mensagem automática seja enviada no WhatsApp. Pode ser via Python ou ferramenta no-code.",
    tags: ["Python", "Automação", "WhatsApp API", "Excel"],
    budget: "R$ 500 - 1.000",
    published: "há 4 horas",
    bids: 2,
    client: { location: "Portugal", rating: 0 },
  },
  {
    id: 4,
    title: "Edição de Vídeo para Canal Dark (Shorts/TikTok)",
    description:
      "Procuro editor para cortes dinâmicos estilo Alex Hormozi. Legendas, B-roll e efeitos sonoros. Pacote de 10 vídeos por mês.",
    tags: ["Premiere", "After Effects", "CapCut", "TikTok"],
    budget: "R$ 1.200",
    published: "há 6 horas",
    bids: 8,
    client: { location: "Brasil", rating: 4.5 },
  },
];

export default function EncontrarProjetosPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  useGSAP(
    () => {
      // Animação de entrada dos cards (efeito cascata)
      gsap.fromTo(
        ".gsap-project-card",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 90%",
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-slate-200 p-4 lg:p-8"
    >
      {/* --- HEADER DA PÁGINA (BUSCA) --- */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-futura text-white">
            Encontrar Projetos
          </h1>
          <p className="text-sm text-slate-400">
            Explore oportunidades e envie suas propostas.
          </p>
        </div>

        {/* Barra de Busca */}
        <div className="w-full md:w-auto flex-1 max-w-xl relative">
          <input
            type="text"
            placeholder="Busque por habilidades, título ou palavras-chave..."
            className="w-full bg-slate-900/80 border border-white/10 rounded-full py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#d73cbe] transition-colors shadow-lg shadow-black/20"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* --- SIDEBAR DE FILTROS (Coluna Esquerda) --- */}
        {/* Similar ao Workana, fica na esquerda para filtrar a lista */}
        <aside className="hidden lg:block lg:col-span-1 space-y-8">
          {/* Categorias */}
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <SlidersHorizontal className="w-4 h-4 text-[#d73cbe]" />
              Categorias
            </h3>
            <div className="space-y-3">
              {[
                "Todas",
                "TI e Programação",
                "Design e Multimedia",
                "Marketing e Vendas",
                "Tradução",
                "Jurídico",
              ].map((cat, i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      selectedCategory === cat
                        ? "bg-[#d73cbe] border-[#d73cbe]"
                        : "border-slate-600 group-hover:border-[#d73cbe]"
                    }`}
                  >
                    {selectedCategory === cat && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      selectedCategory === cat
                        ? "text-white font-medium"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    {cat}
                  </span>
                  <input
                    type="radio"
                    name="category"
                    className="hidden"
                    checked={selectedCategory === cat}
                    onChange={() => setSelectedCategory(cat)}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Filtro de Orçamento (Exemplo Visual) */}
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5">
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              Tipo de Projeto
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-4 h-4 rounded border border-slate-600 group-hover:border-[#d73cbe]" />
                <span className="text-sm text-slate-400 group-hover:text-slate-200">
                  Preço Fixo
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-4 h-4 rounded border border-slate-600 group-hover:border-[#d73cbe]" />
                <span className="text-sm text-slate-400 group-hover:text-slate-200">
                  Por Hora
                </span>
              </label>
            </div>
          </div>
        </aside>

        {/* --- LISTA DE PROJETOS (Feed Principal) --- */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header da Lista */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">
              Mostrando <strong>{PROJECTS.length}</strong> resultados
            </span>
            <button className="lg:hidden flex items-center gap-2 text-sm text-[#d73cbe]">
              <Filter className="w-4 h-4" /> Filtros
            </button>
          </div>

          {/* Cards */}
          {PROJECTS.map((project) => (
            <div
              key={project.id}
              className="gsap-project-card group bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-[#d73cbe]/40 transition-all duration-300 hover:shadow-[0_4px_20px_-10px_rgba(215,60,190,0.1)] relative overflow-hidden"
            >
              {/* Barra lateral colorida no hover */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#d73cbe] opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex flex-col md:flex-row justify-between gap-6">
                {/* Info Principal */}
                <div className="flex-1">
                  <div className="flex items-start justify-between md:justify-start gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-[#d73cbe] transition-colors cursor-pointer leading-tight">
                      {project.title}
                    </h3>
                    {/* Publicado há X tempo */}
                    <span className="md:hidden text-xs text-slate-500 whitespace-nowrap">
                      {project.published}
                    </span>
                  </div>

                  {/* Metadados Mobile (Rating e Local) */}
                  <div className="flex md:hidden items-center gap-3 text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {project.client.location}
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-3 h-3 fill-current" />{" "}
                      {project.client.rating}
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 mb-4 leading-relaxed line-clamp-3 md:line-clamp-2">
                    {project.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-md bg-white/5 text-xs font-medium text-slate-300 border border-white/5 group-hover:border-[#d73cbe]/20 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Coluna de Ação e Preço */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 md:min-w-[160px] border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                  {/* Orçamento */}
                  <div className="text-left md:text-right">
                    <p className="text-xs text-slate-500 mb-1">Orçamento</p>
                    <p className="text-base md:text-lg font-bold text-white font-mono">
                      {project.budget}
                    </p>
                  </div>

                  {/* Botão de Ação */}
                  <button className="py-2 px-5 rounded-lg bg-[#d73cbe] hover:bg-[#b0269a] text-white text-sm font-bold transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:-translate-y-0.5 whitespace-nowrap">
                    Ver Projeto
                  </button>

                  {/* Publicado (Desktop) */}
                  <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 mt-auto">
                    <Clock className="w-3 h-3" />
                    {project.published}
                  </div>
                </div>
              </div>

              {/* Rodapé do Card (Rating Desktop) */}
              <div className="hidden md:flex items-center gap-6 mt-4 pt-4 border-t border-white/5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  {project.client.location}
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(project.client.rating)
                            ? "fill-current"
                            : "text-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-slate-400">
                    ({project.client.rating})
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-2 cursor-pointer hover:text-[#d73cbe] transition-colors">
                  <Heart className="w-3 h-3" /> Salvar
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
