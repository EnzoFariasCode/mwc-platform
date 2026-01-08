"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import {
  MapPin,
  Star,
  Filter,
  MessageSquare,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search, // Importei o ícone de Search
  DollarSign, // Importei o ícone de Dollar
} from "lucide-react";
import Link from "next/link";

// --- DADOS MOCKADOS EXPANDIDOS ---
const MOCK_PROFESSIONALS = [
  {
    id: 1,
    name: "Carlos Mendes",
    role: "Eletricista Residencial",
    location: "Centro, São Paulo - SP",
    rating: 4.9,
    reviews: 124,
    price: "R$ 150/hora",
    image: "https://i.pravatar.cc/150?u=carlos",
    verified: true,
    tags: ["Elétrica", "Instalação", "Reparos"],
    category: "Reformas",
    yearsOfExperience: 8,
    online: true,
  },
  {
    id: 2,
    name: "Ana Julia Pereira",
    role: "Web Designer & UI/UX",
    location: "Remoto / São Paulo",
    rating: 5.0,
    reviews: 89,
    price: "A combinar",
    image: "https://i.pravatar.cc/150?u=ana",
    verified: true,
    tags: ["Design", "Figma", "Web"],
    category: "Design",
    yearsOfExperience: 3,
    online: false,
  },
  {
    id: 3,
    name: "Roberto Silva",
    role: "Dev Fullstack",
    location: "Vila Madalena, São Paulo",
    rating: 4.7,
    reviews: 56,
    price: "Orçamento fixo",
    image: "https://i.pravatar.cc/150?u=roberto",
    verified: false,
    tags: ["Programação", "React", "Node"],
    category: "Programação",
    yearsOfExperience: 5,
    online: true,
  },
  {
    id: 4,
    name: "Mariana Costa",
    role: "Personal Trainer",
    location: "Moema, São Paulo",
    rating: 4.9,
    reviews: 210,
    price: "R$ 100/hora",
    image: "https://i.pravatar.cc/150?u=mariana",
    verified: true,
    tags: ["Saúde", "Fitness", "Treino"],
    category: "Saúde",
    yearsOfExperience: 6,
    online: true,
  },
  {
    id: 5,
    name: "João Tech",
    role: "Técnico de Informática",
    location: "Pinheiros, São Paulo",
    rating: 4.5,
    reviews: 34,
    price: "R$ 80/visita",
    image: "https://i.pravatar.cc/150?u=joao",
    verified: true,
    tags: ["Computador", "Formatação", "Redes"],
    category: "Tecnologia",
    yearsOfExperience: 10,
    online: false,
  },
  {
    id: 6,
    name: "Fernanda Lima",
    role: "Arquiteta",
    location: "Jardins, São Paulo",
    rating: 4.8,
    reviews: 42,
    price: "A combinar",
    image: "https://i.pravatar.cc/150?u=fernanda",
    verified: true,
    tags: ["Projetos", "Interiores", "Obras"],
    category: "Design",
    yearsOfExperience: 12,
    online: false,
  },
  {
    id: 7,
    name: "Ricardo Oliveira",
    role: "Professor de Inglês",
    location: "Remoto",
    rating: 5.0,
    reviews: 15,
    price: "R$ 60/hora",
    image: "https://i.pravatar.cc/150?u=ricardo",
    verified: true,
    tags: ["Aulas", "Idiomas", "Inglês"],
    category: "Educação",
    yearsOfExperience: 4,
    online: true,
  },
  {
    id: 8,
    name: "Lucas Santos",
    role: "Desenvolvedor Mobile",
    location: "Remoto",
    rating: 4.6,
    reviews: 28,
    price: "R$ 120/hora",
    image: "https://i.pravatar.cc/150?u=lucas",
    verified: false,
    tags: ["Programação", "Flutter", "App"],
    category: "Programação",
    yearsOfExperience: 2,
    online: false,
  },
];

const ITEMS_PER_PAGE = 5;

// --- FUNÇÃO AUXILIAR PARA PARSEAR PREÇO ---
// Transforma "R$ 150/hora" em 150. "A combinar" vira 0.
const parsePrice = (priceStr: string) => {
  if (!priceStr) return 0;
  // Remove tudo que não for dígito
  const numbers = priceStr.replace(/[^0-9]/g, "");
  return numbers ? parseInt(numbers) : 0;
};

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parâmetros da URL (Valores iniciais)
  const queryService = searchParams.get("q") || "";
  const queryLocation = searchParams.get("local") || "";

  // Estados Locais de Filtro
  const [filteredPros, setFilteredPros] = useState(MOCK_PROFESSIONALS);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados dos Inputs
  const [localSearch, setLocalSearch] = useState(queryService); // Barra de pesquisa textual
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState("relevancia");

  // Novos Estados de Preço
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const categories = [
    "Todas",
    "Reformas",
    "Design",
    "Programação",
    "Saúde",
    "Tecnologia",
    "Educação",
  ];

  // Sincroniza o estado localSearch se a URL mudar externamente
  useEffect(() => {
    setLocalSearch(queryService);
  }, [queryService]);

  // --- LÓGICA DE FILTRAGEM UNIFICADA ---
  useEffect(() => {
    let results = MOCK_PROFESSIONALS.filter((pro) => {
      // 1. Filtro de Texto (Nome, Role, Tags, Categoria)
      const searchTerm = localSearch.toLowerCase();
      const matchText =
        localSearch === "" ||
        pro.name.toLowerCase().includes(searchTerm) ||
        pro.role.toLowerCase().includes(searchTerm) ||
        pro.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
        pro.category.toLowerCase().includes(searchTerm);

      // 2. Filtro de Localização (Vindo da URL por enquanto)
      const matchLocation =
        queryLocation === "" ||
        pro.location.toLowerCase().includes(queryLocation.toLowerCase());

      // 3. Filtro de Categoria (Sidebar)
      const matchCategory =
        selectedCategory === "Todas" || pro.category === selectedCategory;

      // 4. Filtro de Preço (Novo)
      const numericPrice = parsePrice(pro.price);
      let matchPrice = true;

      // Se tiver Minimo definido
      if (minPrice && minPrice !== "") {
        // Se o preço for 0 (A combinar/Orçamento fixo), decidimos se mostramos ou não.
        // Geralmente se a pessoa filtra preço, ela quer valor explicito.
        if (numericPrice === 0 || numericPrice < parseInt(minPrice)) {
          matchPrice = false;
        }
      }
      // Se tiver Máximo definido
      if (maxPrice && maxPrice !== "") {
        if (numericPrice > parseInt(maxPrice)) {
          matchPrice = false;
        }
      }

      return matchText && matchLocation && matchCategory && matchPrice;
    });

    // 5. Ordenação
    if (sortBy === "experiencia") {
      results.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
    } else if (sortBy === "avaliacao") {
      results.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "menor_preco") {
      results.sort((a, b) => {
        const priceA = parsePrice(a.price) || 999999; // Joga 'A combinar' pro final
        const priceB = parsePrice(b.price) || 999999;
        return priceA - priceB;
      });
    }

    setFilteredPros(results);
    setCurrentPage(1);
  }, [
    localSearch,
    queryLocation,
    selectedCategory,
    sortBy,
    minPrice,
    maxPrice,
  ]);

  // Paginação
  const totalPages = Math.ceil(filteredPros.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredPros.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setSelectedCategory("Todas");
    setSortBy("relevancia");
    setLocalSearch("");
    setMinPrice("");
    setMaxPrice("");
    router.push("/search"); // Limpa URL
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* CABEÇALHO DA BUSCA */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Explorar Profissionais
          </h1>
          <p className="text-slate-400">
            {filteredPros.length} profissionais encontrados
            {queryLocation && ` em "${queryLocation}"`}.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* --- SIDEBAR DE FILTROS --- */}
        <aside className="w-full lg:w-1/4 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm sticky top-24">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <Filter className="text-purple-400 w-5 h-5" />
              <h3 className="font-semibold text-white">Filtros</h3>
            </div>

            {/* 1. BARRA DE PESQUISA (NOVA) */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium text-slate-300">
                Buscar por nome ou área
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Ex: Eletricista, Design..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            {/* 2. FILTRO DE PREÇO (NOVO) */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium text-slate-300">
                Faixa de Preço (R$)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                    R$
                  </span>
                  <input
                    type="number"
                    placeholder="Mín"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-8 pr-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <span className="text-slate-500">-</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                    R$
                  </span>
                  <input
                    type="number"
                    placeholder="Máx"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-8 pr-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Categorias */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium text-slate-300">
                Categorias
              </label>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {categories.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                      className="rounded-full border-slate-700 bg-slate-800 text-purple-500 focus:ring-purple-500/20 accent-purple-500"
                    />
                    <span
                      className={`text-sm group-hover:text-purple-300 transition-colors ${
                        selectedCategory === cat
                          ? "text-white font-medium"
                          : "text-slate-400"
                      }`}
                    >
                      {cat}
                    </span>
                  </label>
                ))}
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
                <option value="relevancia">Mais Relevantes</option>
                <option value="experiencia">Mais Experiência</option>
                <option value="avaliacao">Melhores Avaliados</option>
                <option value="menor_preco">Menor Preço</option>
              </select>
            </div>

            <button
              onClick={handleClearFilters}
              className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600"
            >
              Limpar Todos os Filtros
            </button>
          </div>
        </aside>

        {/* --- LISTA E PAGINAÇÃO --- */}
        <main className="flex-1">
          {filteredPros.length > 0 ? (
            <>
              <div className="grid gap-4 mb-8">
                {currentItems.map((pro) => (
                  <div
                    key={pro.id}
                    className="bg-slate-900/40 border border-slate-800 hover:border-purple-500/30 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-purple-500/5 flex flex-col sm:flex-row gap-6 items-start"
                  >
                    {/* Foto */}
                    <div className="relative shrink-0">
                      <img
                        src={pro.image}
                        alt={pro.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-slate-700"
                      />
                      {pro.online && (
                        <span
                          className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full"
                          title="Online agora"
                        ></span>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                        <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {pro.name}
                            {pro.verified && (
                              <span title="Profissional Verificado">
                                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                              </span>
                            )}
                          </h2>
                          <p className="text-purple-400 font-medium">
                            {pro.role}
                          </p>
                        </div>
                        <div className="text-left md:text-right shrink-0">
                          <span className="block text-xl font-bold text-white">
                            {pro.price}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-bold">{pro.rating}</span>
                          <span className="text-slate-500">
                            ({pro.reviews} reviews)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {pro.location}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          • {pro.yearsOfExperience} anos de experiência
                        </div>
                      </div>

                      {/* Tags e Botões */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
                        <div className="flex flex-wrap gap-2">
                          {pro.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto">
                          <Link
                            href={`/profissional/${pro.id}`}
                            className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-sm transition-colors text-center"
                          >
                            Ver Perfil
                          </Link>
                          {/* Botão Chamar vai para Login */}
                          <Link
                            href={`/login?action=chat&proId=${
                              pro.id
                            }&proName=${encodeURIComponent(pro.name)}`}
                            className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Chamar
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINAÇÃO CONTROLS */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? "bg-purple-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            // ESTADO VAZIO
            <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800">
              <h3 className="text-xl font-bold text-white mb-2">
                Nenhum profissional encontrado
              </h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Tente limpar os filtros para ver todas as opções.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-6 text-purple-400 hover:text-purple-300 font-medium"
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

// Wrapper Principal
export default function SearchPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Suspense
        fallback={
          <div className="p-10 text-center text-white">Carregando...</div>
        }
      >
        <SearchContent />
      </Suspense>
    </div>
  );
}
