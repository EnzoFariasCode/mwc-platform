/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  MapPin,
  Star,
  Filter,
  MessageSquare,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { getProfessionals } from "@/modules/search/actions/get-professionals";
import { getCategories } from "@/modules/search/actions/get-categories";

const ITEMS_PER_PAGE = 5;

interface ProfessionalSearchProps {
  baseRoute?: string;
}

export function ProfessionalSearch({
  baseRoute = "/search",
}: ProfessionalSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Verifica se é rota do dashboard
  const isDashboard = baseRoute.includes("/dashboard");

  const queryService = searchParams.get("q") || "";
  const queryLocation = searchParams.get("local") || "";

  // Estados de Dados
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Categorias do banco
  const [dbCategories, setDbCategories] = useState<string[]>([]);

  // Filtros
  const [localSearch, setLocalSearch] = useState(queryService);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState("relevancia");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // 1. Busca Categorias
  useEffect(() => {
    async function loadCategories() {
      const cats = await getCategories();
      setDbCategories(cats);
    }
    loadCategories();
  }, []);

  // Sincroniza URL
  useEffect(() => {
    setLocalSearch(queryService);
  }, [queryService]);

  // Busca Profissionais
  useEffect(() => {
    const fetchPros = async () => {
      setIsLoading(true);

      const res = await getProfessionals({
        query: localSearch,
        location: queryLocation,
        category: selectedCategory !== "Todas" ? selectedCategory : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });

      if (res.success) {
        setProfessionals(res.data);
        setTotalResults(res.total);
        setTotalPages(res.totalPages);
      }

      setIsLoading(false);
    };

    const timeoutId = setTimeout(() => {
      fetchPros();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    localSearch,
    queryLocation,
    selectedCategory,
    minPrice,
    maxPrice,
    sortBy,
    currentPage,
  ]);

  const handleClearFilters = () => {
    setSelectedCategory("Todas");
    setSortBy("relevancia");
    setLocalSearch("");
    setMinPrice("");
    setMaxPrice("");
    router.push(baseRoute);
  };

  const displayCategories = ["Todas", ...dbCategories];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* CABEÇALHO */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Explorar Profissionais
          </h1>
          <p className="text-slate-400">
            {totalResults} profissionais encontrados
            {queryLocation && ` em "${queryLocation}"`}.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* SIDEBAR DE FILTROS */}
        <aside className="w-full lg:w-1/4 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <Filter className="text-purple-400 w-5 h-5" />
              <h3 className="font-semibold text-white">Filtros</h3>
            </div>

            {/* Busca Texto */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium text-slate-300">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Nome, bio ou habilidade..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Preço */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium text-slate-300">
                Valor Hora (R$)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:border-purple-500 outline-none"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Categorias */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium text-slate-300">
                Categorias
              </label>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                {displayCategories.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                      className="accent-purple-500"
                    />
                    <span
                      className={`text-sm ${selectedCategory === cat ? "text-white font-medium" : "text-slate-400 group-hover:text-purple-300"}`}
                    >
                      {cat}
                    </span>
                  </label>
                ))}
                {displayCategories.length === 1 && (
                  <span className="text-xs text-slate-500 italic px-1">
                    Nenhuma categoria encontrada.
                  </span>
                )}
              </div>
            </div>

            {/* Ordenação */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium text-slate-300">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-300 outline-none focus:border-purple-500"
              >
                <option value="relevancia">Relevância</option>
                <option value="menor_preco">Menor Preço</option>
                <option value="avaliacao">Melhor Avaliação</option>
                <option value="experiencia">Mais Experiência</option>
              </select>
            </div>

            <button
              onClick={handleClearFilters}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700"
            >
              Limpar Filtros
            </button>
          </div>
        </aside>

        {/* LISTA DE RESULTADOS */}
        <main className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
              <p className="text-slate-400">
                Buscando os melhores profissionais...
              </p>
            </div>
          ) : professionals.length > 0 ? (
            <>
              <div className="grid gap-4 mb-8">
                {professionals.map((pro) => (
                  <div
                    key={pro.id}
                    className="bg-slate-900/40 border border-slate-800 hover:border-purple-500/30 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-purple-500/5 flex flex-col sm:flex-row gap-6 items-start"
                  >
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/images/user/${pro.id}`}
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(pro.name)}&color=fff&background=7c3aed`;
                        }}
                        alt={pro.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-slate-700 bg-slate-800"
                      />
                      <span
                        className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full"
                        title="Disponível"
                      ></span>
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                        <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {pro.name}
                            {pro.ratingCount > 0 && pro.rating >= 4.5 && (
                              <span title="Profissional Top">
                                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                              </span>
                            )}
                          </h2>
                          <p className="text-purple-400 font-medium truncate max-w-[200px] sm:max-w-md">
                            {pro.jobTitle || "Profissional MWC"}
                          </p>
                        </div>
                        <div className="text-left md:text-right shrink-0">
                          <span className="block text-xl font-bold text-white">
                            {pro.hourlyRate
                              ? `R$ ${pro.hourlyRate}/h`
                              : "A combinar"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-bold">
                            {pro.ratingCount > 0 && pro.rating
                              ? pro.rating.toFixed(1)
                              : "Novo"}
                          </span>
                          {pro.ratingCount > 0 && (
                            <span className="text-slate-500 text-xs">
                              ({pro.ratingCount} avaliaÃ§Ãµes)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {pro.city
                            ? `${pro.city}, ${pro.state || ""}`
                            : "Brasil"}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(pro.skills) &&
                          pro.skills.length > 0 ? (
                            pro.skills.slice(0, 3).map((tag: string) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-1 bg-slate-800 text-slate-500 text-xs rounded-full italic">
                              Geral
                            </span>
                          )}
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto">
                          {/* === AQUI ESTÁ A LÓGICA DE PROTEÇÃO === 
                              Se não estiver no dashboard, manda pro Login.
                              Se estiver, manda pro Perfil Privado.
                          */}
                          <Link
                            href={
                              isDashboard
                                ? `/dashboard/profissional/${pro.id}`
                                : `/login?callbackUrl=/dashboard/profissional/${pro.id}`
                            }
                            className="flex-1 sm:flex-none"
                          >
                            <button className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-sm transition-colors text-center cursor-pointer">
                              Ver Perfil
                            </button>
                          </Link>

                          <Link
                            href={
                              isDashboard
                                ? `/dashboard/chat?newChat=${pro.id}`
                                : `/login?action=chat&proId=${pro.id}&proName=${encodeURIComponent(pro.name)}`
                            }
                            className="flex-1 sm:flex-none"
                          >
                            <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-900/20">
                              <MessageSquare className="w-4 h-4" />
                              Chamar
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-slate-800 text-white disabled:opacity-50 hover:bg-slate-700 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-slate-400 text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-slate-800 text-white disabled:opacity-50 hover:bg-slate-700 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800">
              <h3 className="text-xl font-bold text-white mb-2">
                Nenhum profissional encontrado
              </h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Tente ajustar os termos da busca ou limpar os filtros.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-6 text-purple-400 hover:text-purple-300 font-medium underline underline-offset-4"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
