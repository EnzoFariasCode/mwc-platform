"use client";

import { PageContainer } from "@/components/dashboard/PageContainer";
import { useState, useRef } from "react";
import Link from "next/link"; // Importante: Link importado
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
  Zap,
  Briefcase,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// --- DADOS MOCKADOS ---
const PROJECTS = [
  {
    id: 1,
    title: "Desenvolvimento de App Flutter para Delivery",
    description:
      "Preciso de um desenvolvedor experiente em Flutter para criar um aplicativo de delivery completo. O app deve ter integração com mapas, gateway de pagamento e painel administrativo.",
    category: "TI e Programação",
    tags: ["Flutter", "Mobile", "Firebase", "API Rest"],
    budget: { type: "fixed", value: "R$ 3.000 - 5.000" },
    deadline: "Urgente",
    published: "há 2 horas",
    bids: 5,
    client: { location: "São Paulo, BR", rating: 4.8 },
  },
  {
    id: 2,
    title: "Redesign de Landing Page para Infoproduto",
    description:
      "Estamos buscando um UI/UX Designer para reformular nossa landing page de vendas. O objetivo é aumentar a conversão. Necessário entregar o figma editável.",
    category: "Design e Multimedia",
    tags: ["Figma", "Landing Page", "Copywriting"],
    budget: { type: "fixed", value: "R$ 800 - 1.500" },
    deadline: "Para essa semana",
    published: "há 45 minutos",
    bids: 12,
    client: { location: "Rio de Janeiro, BR", rating: 5.0 },
  },
  {
    id: 3,
    title: "Consultoria Jurídica para Contrato de Vesting",
    description:
      "Startup em fase inicial precisa de advogado para redigir contrato de vesting para os sócios fundadores.",
    category: "Jurídico",
    tags: ["Contratos", "Direito Societário", "Startup"],
    budget: { type: "hourly", value: "R$ 150/h" },
    deadline: "Para este mês",
    published: "há 4 horas",
    bids: 2,
    client: { location: "Remoto", rating: 0 },
  },
  {
    id: 4,
    title: "Edição de Vídeo estilo Reels/TikTok",
    description:
      "Procuro editor para cortes dinâmicos. Legendas, B-roll e efeitos sonoros. Pacote de 10 vídeos por mês recorrente.",
    category: "Design e Multimedia",
    tags: ["Premiere", "CapCut", "TikTok", "After Effects"],
    budget: { type: "fixed", value: "R$ 1.200" },
    deadline: "Urgente",
    published: "há 6 horas",
    bids: 8,
    client: { location: "Curitiba, BR", rating: 4.5 },
  },
];

const CATEGORIES = [
  "Todas",
  "Design e Multimedia",
  "TI e Programação",
  "Marketing e Vendas",
  "Tradução e Conteúdo",
  "Jurídico",
  "Engenharia",
];

export default function EncontrarProjetosPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [filterType, setFilterType] = useState<"all" | "fixed" | "hourly">(
    "all"
  );

  const filteredProjects = PROJECTS.filter((p) => {
    const catMatch =
      selectedCategory === "Todas" || p.category === selectedCategory;
    const typeMatch = filterType === "all" || p.budget.type === filterType;
    return catMatch && typeMatch;
  });

  useGSAP(
    () => {
      gsap.fromTo(
        ".gsap-project-card",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 95%",
          },
        }
      );
    },
    { scope: containerRef, dependencies: [selectedCategory, filterType] }
  );

  return (
    <PageContainer>
      <div ref={containerRef} className="space-y-8">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-futura text-white">
              Encontrar Projetos
            </h1>
            <p className="text-sm text-slate-400">
              Explore oportunidades compatíveis com suas habilidades.
            </p>
          </div>

          <div className="w-full md:w-auto flex-1 max-w-xl relative">
            <input
              type="text"
              placeholder="Busque por tags (ex: Flutter, Logo)..."
              className="w-full bg-slate-900 border border-white/10 rounded-full py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#d73cbe] transition-colors shadow-lg shadow-black/20"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* --- SIDEBAR FILTROS --- */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="bg-slate-900 p-5 rounded-2xl border border-white/5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4 text-[#d73cbe]" />
                Categorias
              </h3>
              <div className="space-y-2">
                {CATEGORIES.map((cat, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-3 cursor-pointer group py-1"
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

            <div className="bg-slate-900 p-5 rounded-2xl border border-white/5">
              <h3 className="text-white font-bold mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#d73cbe]" /> Orçamento
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      filterType === "all"
                        ? "border-[#d73cbe]"
                        : "border-slate-600"
                    }`}
                  >
                    {filterType === "all" && (
                      <div className="w-2 h-2 rounded-full bg-[#d73cbe]" />
                    )}
                  </div>
                  <span className="text-sm text-slate-400 group-hover:text-white">
                    Qualquer tipo
                  </span>
                  <input
                    type="radio"
                    name="btype"
                    className="hidden"
                    onChange={() => setFilterType("all")}
                  />
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      filterType === "fixed"
                        ? "border-[#d73cbe]"
                        : "border-slate-600"
                    }`}
                  >
                    {filterType === "fixed" && (
                      <div className="w-2 h-2 rounded-full bg-[#d73cbe]" />
                    )}
                  </div>
                  <span className="text-sm text-slate-400 group-hover:text-white">
                    Preço Fixo
                  </span>
                  <input
                    type="radio"
                    name="btype"
                    className="hidden"
                    onChange={() => setFilterType("fixed")}
                  />
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      filterType === "hourly"
                        ? "border-[#d73cbe]"
                        : "border-slate-600"
                    }`}
                  >
                    {filterType === "hourly" && (
                      <div className="w-2 h-2 rounded-full bg-[#d73cbe]" />
                    )}
                  </div>
                  <span className="text-sm text-slate-400 group-hover:text-white">
                    Por Hora
                  </span>
                  <input
                    type="radio"
                    name="btype"
                    className="hidden"
                    onChange={() => setFilterType("hourly")}
                  />
                </label>
              </div>
            </div>
          </aside>

          {/* --- LISTA DE PROJETOS --- */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-sm text-slate-400">
                Mostrando <strong>{filteredProjects.length}</strong> projetos
              </span>
              <button className="lg:hidden flex items-center gap-2 text-sm text-[#d73cbe] font-bold">
                <Filter className="w-4 h-4" /> Filtros
              </button>
            </div>

            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="gsap-project-card group bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-[#d73cbe]/40 transition-all duration-300 hover:shadow-[0_4px_20px_-10px_rgba(215,60,190,0.1)] relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#d73cbe] opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      {/* AQUI: Título transformado em Link */}
                      <Link
                        href={`/dashboard/encontrar-projetos/${project.id}`}
                      >
                        <h3 className="text-lg font-bold text-white group-hover:text-[#d73cbe] transition-colors cursor-pointer leading-tight hover:underline decoration-[#d73cbe]/50 underline-offset-4">
                          {project.title}
                        </h3>
                      </Link>

                      {project.deadline === "Urgente" && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20 uppercase">
                          <Zap className="w-3 h-3 fill-current" /> Urgente
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-400 mb-4 leading-relaxed line-clamp-2">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
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

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 md:min-w-[140px] border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                        {project.budget.type === "fixed"
                          ? "Preço Fixo"
                          : "Por Hora"}
                      </p>
                      <p className="text-base font-bold text-white font-mono">
                        {project.budget.value}
                      </p>
                    </div>

                    {/* AQUI: Botão transformado em Link */}
                    <Link href={`/dashboard/encontrar-projetos/${project.id}`}>
                      <button className="py-2 px-5 rounded-lg bg-[#d73cbe] hover:bg-[#b0269a] text-white text-sm font-bold transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:-translate-y-0.5 whitespace-nowrap cursor-pointer">
                        Ver Projeto
                      </button>
                    </Link>

                    <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 mt-auto">
                      <Clock className="w-3 h-3" />
                      {project.published}
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-6 mt-5 pt-4 border-t border-white/5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" />
                    {project.category}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {project.client.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex text-yellow-500">
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                    <span className="text-slate-400">
                      {project.client.rating > 0
                        ? project.client.rating
                        : "Novo"}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-2 cursor-pointer hover:text-[#d73cbe] transition-colors group/save">
                    <Heart className="w-3 h-3 group-hover/save:fill-current" />{" "}
                    Salvar
                  </div>
                </div>
              </div>
            ))}

            {filteredProjects.length === 0 && (
              <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-white/5 border-dashed">
                <p className="text-slate-500">
                  Nenhum projeto encontrado nesta categoria.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("Todas");
                    setFilterType("all");
                  }}
                  className="text-[#d73cbe] text-sm font-bold mt-2 hover:underline cursor-pointer"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
