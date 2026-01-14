"use client";

import { PageContainer } from "@/components/dashboard/PageContainer";
import { useState, useRef } from "react";
import Link from "next/link"; // Voltamos com o Link
import {
  Search,
  MapPin,
  Clock,
  DollarSign,
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

const CATEGORIES = [
  "Todas",
  "Design e Multimedia",
  "TI e Programação",
  "Marketing e Vendas",
  "Tradução e Conteúdo",
  "Jurídico",
  "Engenharia",
];

function timeAgo(date: Date | string) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "agora mesmo";
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} h`;
  return `há ${Math.floor(diffInSeconds / 86400)} dias`;
}

export default function ProjectListView({
  initialProjects,
}: {
  initialProjects: any[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [filterType, setFilterType] = useState<"all" | "fixed" | "hourly">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = initialProjects.filter((p) => {
    const catMatch =
      selectedCategory === "Todas" || p.category === selectedCategory;
    const typeMatch = filterType === "all" || p.budgetType === filterType;
    const searchMatch =
      searchTerm === "" ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags.some((t: string) =>
        t.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return catMatch && typeMatch && searchMatch;
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
    { scope: containerRef, dependencies: [filteredProjects] }
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-full py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#d73cbe] transition-colors shadow-lg shadow-black/20"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* --- SIDEBAR FILTERS --- */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="bg-slate-900 p-5 rounded-2xl border border-white/5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4 text-[#d73cbe]" />{" "}
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
            {/* Filtro Simples de Preço */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-white/5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
                <DollarSign className="w-4 h-4 text-[#d73cbe]" /> Tipo de
                Orçamento
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === "all"
                      ? "bg-[#d73cbe] text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType("fixed")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === "fixed"
                      ? "bg-[#d73cbe] text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Fixo
                </button>
                <button
                  onClick={() => setFilterType("hourly")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === "hourly"
                      ? "bg-[#d73cbe] text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  Hora
                </button>
              </div>
            </div>
          </aside>

          {/* --- LISTA --- */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-sm text-slate-400">
                Mostrando <strong>{filteredProjects.length}</strong> projetos
              </span>
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
                      {/* Título como Link */}
                      <Link
                        href={`/dashboard/encontrar-projetos/${project.id}`}
                        className="text-left"
                      >
                        <h3 className="text-lg font-bold text-white group-hover:text-[#d73cbe] transition-colors cursor-pointer leading-tight hover:underline decoration-[#d73cbe]/50 underline-offset-4">
                          {project.title}
                        </h3>
                      </Link>

                      {project.deadline.includes("Urgente") && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20 uppercase">
                          <Zap className="w-3 h-3 fill-current" /> Urgente
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-400 mb-4 leading-relaxed line-clamp-2">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
                      {project.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-md bg-white/5 text-xs font-medium text-slate-300 border border-white/5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 md:min-w-[140px] border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">
                        {project.budgetType === "fixed"
                          ? "Preço Fixo"
                          : "Por Hora"}
                      </p>
                      <p className="text-base font-bold text-white font-mono">
                        {project.budgetLabel}
                      </p>
                    </div>

                    {/* BOTÃO LINK para a Página de Detalhes */}
                    <Link
                      href={`/dashboard/encontrar-projetos/${project.id}`}
                      className="py-2 px-5 rounded-lg bg-[#d73cbe] hover:bg-[#b0269a] text-white text-sm font-bold transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:-translate-y-0.5 whitespace-nowrap cursor-pointer text-center"
                    >
                      Ver Projeto
                    </Link>

                    <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 mt-auto">
                      <Clock className="w-3 h-3" /> {timeAgo(project.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-6 mt-5 pt-4 border-t border-white/5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" /> {project.category}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />{" "}
                    {project.owner?.city
                      ? `${project.owner.city}, ${project.owner.state}`
                      : "Remoto/ND"}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex text-yellow-500">
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                    <span className="text-slate-400">
                      {project.owner?.rating?.toFixed(1) || "Novo"}
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
                <p className="text-slate-500">Nenhum projeto encontrado.</p>
                <button
                  onClick={() => {
                    setSelectedCategory("Todas");
                    setFilterType("all");
                    setSearchTerm("");
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
